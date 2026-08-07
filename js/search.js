/* MM Housewares Hardware — catalog search + autosuggest
 * Fetches /data/search-index.json (built from /data/products/** and
 * /data/problems.json — see /data for the source files, and
 * README-catalog.md for how to regenerate the index) and powers a
 * live autosuggest dropdown wired to any input with [data-site-search].
 */
(function () {
  var INDEX_URL = 'data/search-index.json';
  var indexPromise = null;

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch(INDEX_URL)
        .then(function (r) {
          if (!r.ok) throw new Error('Failed to load search index: ' + r.status);
          return r.json();
        })
        .then(function (data) { return data.entries || []; })
        .catch(function (err) {
          console.error('Catalog search index failed to load', err);
          return [];
        });
    }
    return indexPromise;
  }

  function scoreEntry(entry, queryWords) {
    var s = 0;
    var label = entry.label.toLowerCase();
    for (var i = 0; i < queryWords.length; i++) {
      var qw = queryWords[i];
      if (label.indexOf(qw) !== -1) s += 2;
      for (var j = 0; j < entry.keywords.length; j++) {
        var kw = entry.keywords[j];
        if (kw === qw) s += 3;
        else if (kw.indexOf(qw) === 0 || qw.indexOf(kw) === 0) s += 2;
        else if (kw.indexOf(qw) !== -1) s += 1;
      }
    }
    return s;
  }

  var STOPWORDS = ['a', 'an', 'the', 'my', 'is', 'it', 'to', 'in', 'on', 'for', 'of', 'and', 'or', 'i', 'im', "i'm", 'has', 'have', 'need', 'with'];

  function search(entries, query, limit) {
    var q = query.trim().toLowerCase();
    if (!q) return [];
    var queryWords = q.split(/\s+/).filter(function (w) {
      return w.length > 2 && STOPWORDS.indexOf(w) === -1;
    });
    if (queryWords.length === 0) queryWords = q.split(/\s+/).filter(Boolean);
    var scored = [];
    for (var i = 0; i < entries.length; i++) {
      var s = scoreEntry(entries[i], queryWords);
      if (s > 0) scored.push({ entry: entries[i], score: s });
    }
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, limit || 8).map(function (x) { return x.entry; });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function initSearchWidget(input) {
    var wrap = input.closest('[data-site-search-wrap]') || input.parentElement;
    var resultsEl = wrap.querySelector('[data-site-search-results]');
    if (!resultsEl) {
      resultsEl = document.createElement('div');
      resultsEl.className = 'search-results';
      resultsEl.setAttribute('data-site-search-results', '');
      wrap.appendChild(resultsEl);
    }
    var activeIndex = -1;
    var currentMatches = [];

    function render(matches) {
      currentMatches = matches;
      activeIndex = -1;
      if (matches.length === 0) {
        resultsEl.innerHTML = '<div class="search-empty">No matches yet — try a product name (like "deck screw") or a problem (like "leaky faucet").</div>';
        resultsEl.hidden = false;
        return;
      }
      resultsEl.innerHTML = matches.map(function (m, i) {
        var badge = m.type === 'product' ? 'Product' : 'How-To';
        var url = m.type === 'product' ? 'product.html?id=' + encodeURIComponent(m.id) : 'guide.html?id=' + encodeURIComponent(m.id);
        return (
          '<a class="search-result" href="' + url + '" data-index="' + i + '">' +
            '<span class="search-badge search-badge-' + m.type + '">' + badge + '</span>' +
            '<span class="search-result-text">' +
              '<span class="search-result-label">' + escapeHtml(m.label) + '</span>' +
              '<span class="search-result-subtitle">' + escapeHtml(m.subtitle) + '</span>' +
            '</span>' +
          '</a>'
        );
      }).join('');
      resultsEl.hidden = false;
    }

    function close() {
      resultsEl.hidden = true;
      activeIndex = -1;
    }

    function setActive(i) {
      var items = resultsEl.querySelectorAll('.search-result');
      items.forEach(function (el) { el.classList.remove('is-active'); });
      if (items[i]) {
        items[i].classList.add('is-active');
        items[i].scrollIntoView({ block: 'nearest' });
      }
      activeIndex = i;
    }

    loadIndex().then(function (entries) {
      input.addEventListener('input', function () {
        var matches = search(entries, input.value, 8);
        if (!input.value.trim()) { close(); return; }
        render(matches);
      });

      input.addEventListener('keydown', function (e) {
        if (resultsEl.hidden) return;
        var items = resultsEl.querySelectorAll('.search-result');
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActive(Math.min(activeIndex + 1, items.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActive(Math.max(activeIndex - 1, 0));
        } else if (e.key === 'Enter') {
          if (activeIndex >= 0 && items[activeIndex]) {
            window.location.href = items[activeIndex].getAttribute('href');
          }
        } else if (e.key === 'Escape') {
          close();
        }
      });

      input.addEventListener('focus', function () {
        if (input.value.trim() && currentMatches.length) resultsEl.hidden = false;
      });
    });

    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var inputs = document.querySelectorAll('[data-site-search]');
    inputs.forEach(initSearchWidget);
  });
})();
