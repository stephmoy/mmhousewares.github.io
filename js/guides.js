/* MM Housewares Hardware — How-To Guides page
 * Department-driven guide browsing + a scoped type-to-search box.
 * Data sources: data/taxonomy.json, data/problems.json, data/search-index.json
 */
(function () {
  var STOPWORDS = ['a', 'an', 'the', 'my', 'is', 'it', 'to', 'in', 'on', 'for', 'of', 'and', 'or', 'i', "i'm", 'has', 'have', 'need', 'with'];

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

  function searchEntries(entries, query, limit) {
    var q = query.trim().toLowerCase();
    if (!q) return [];
    var queryWords = q.split(/\s+/).filter(function (w) { return w.length > 2 && STOPWORDS.indexOf(w) === -1; });
    if (queryWords.length === 0) queryWords = q.split(/\s+/).filter(Boolean);
    var scored = [];
    for (var i = 0; i < entries.length; i++) {
      var s = scoreEntry(entries[i], queryWords);
      if (s > 0) scored.push({ entry: entries[i], score: s });
    }
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, limit || 8).map(function (x) { return x.entry; });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var outputEl = document.getElementById('guides-output');
    var filterEl = document.getElementById('dept-filter');
    var searchInput = document.getElementById('guides-search');
    var searchWrap = searchInput.closest('[data-guides-search-wrap]');
    var searchResultsEl = searchWrap.querySelector('[data-guides-search-results]');

    var selectedDept = null; // null = "All Departments"

    Promise.all([
      fetch('data/taxonomy.json').then(function (r) { return r.json(); }),
      fetch('data/problems.json').then(function (r) { return r.json(); }),
      fetch('data/search-index.json').then(function (r) { return r.json(); })
    ]).then(function (results) {
      var taxonomy = results[0];
      var problems = results[1].problems || [];
      var searchIndex = (results[2].entries || []).filter(function (e) { return e.type === 'problem'; });

      var departments = taxonomy.departments.map(function (d) { return { name: d.name, aisle: d.aisle }; });

      var problemsByDept = {};
      problems.forEach(function (p) {
        problemsByDept[p.department] = problemsByDept[p.department] || [];
        problemsByDept[p.department].push(p);
      });

      function featuredFor(deptName) {
        var list = problemsByDept[deptName] || [];
        return list.find(function (p) { return p.featured; }) || list[0];
      }

      function guideUrl(id) { return 'guide.html?id=' + encodeURIComponent(id); }

      function renderFilterButtons() {
        var buttons = ['<button type="button" class="dept-btn' + (selectedDept === null ? ' is-active' : '') + '" data-dept="">All Departments</button>'];
        departments.forEach(function (d) {
          var count = (problemsByDept[d.name] || []).length;
          if (!count) return;
          buttons.push(
            '<button type="button" class="dept-btn' + (selectedDept === d.name ? ' is-active' : '') + '" data-dept="' + escapeHtml(d.name) + '">' +
              escapeHtml(d.name) + '<span class="count">(' + count + ')</span>' +
            '</button>'
          );
        });
        filterEl.innerHTML = buttons.join('');
        filterEl.querySelectorAll('.dept-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            selectDept(btn.getAttribute('data-dept') || null);
          });
        });
      }

      function renderDefaultView() {
        var cards = departments.map(function (d) {
          var featured = featuredFor(d.name);
          if (!featured) return '';
          var count = (problemsByDept[d.name] || []).length;
          return (
            '<div class="dept-card">' +
              '<span class="dept-name">' + escapeHtml(d.name) + ' &middot; ' + escapeHtml(d.aisle) + '</span>' +
              '<h3><a href="' + guideUrl(featured.id) + '">' + escapeHtml(featured.title) + '</a></h3>' +
              '<p>' + escapeHtml(featured.description) + '</p>' +
              '<div class="dept-card-links">' +
                '<span>' + count + ' guide' + (count === 1 ? '' : 's') + ' available</span>' +
                '<a href="#" class="card-link" data-dept-browse="' + escapeHtml(d.name) + '">Browse department &rarr;</a>' +
              '</div>' +
            '</div>'
          );
        }).join('');
        outputEl.innerHTML = '<div class="dept-highlight-grid">' + cards + '</div>';
        outputEl.querySelectorAll('[data-dept-browse]').forEach(function (link) {
          link.addEventListener('click', function (e) {
            e.preventDefault();
            selectDept(link.getAttribute('data-dept-browse'));
          });
        });
      }

      function renderDepartmentView(deptName) {
        var list = problemsByDept[deptName] || [];
        var featured = featuredFor(deptName);
        var rest = list.filter(function (p) { return !featured || p.id !== featured.id; });
        var deptMeta = departments.find(function (d) { return d.name === deptName; });

        var html = '<a href="#" class="guides-back-link" data-back>&larr; All departments</a>';
        html += '<div class="section-intro"><span class="eyebrow">' + escapeHtml(deptMeta ? deptMeta.aisle : '') + '</span><h2>' + escapeHtml(deptName) + ' guides</h2></div>';

        if (featured) {
          html += '<a class="guide-highlight" href="' + guideUrl(featured.id) + '">' +
            '<span class="featured-label">Department highlight</span>' +
            '<h3>' + escapeHtml(featured.title) + '</h3>' +
            '<p>' + escapeHtml(featured.description) + '</p>' +
          '</a>';
        }

        if (rest.length) {
          html += '<div class="card-grid" style="margin-top:20px;">' + rest.map(function (p) {
            return '<div class="card"><span class="tag">' + escapeHtml(p.difficulty) + '</span><h3>' + escapeHtml(p.title) + '</h3>' +
              '<p>' + escapeHtml(p.description) + '</p>' +
              '<a href="' + guideUrl(p.id) + '" class="card-link">See the how-to guide &rarr;</a></div>';
          }).join('') + '</div>';
        }

        outputEl.innerHTML = html;
        outputEl.querySelector('[data-back]').addEventListener('click', function (e) {
          e.preventDefault();
          selectDept(null);
        });
      }

      function render() {
        if (selectedDept === null) {
          renderDefaultView();
        } else {
          renderDepartmentView(selectedDept);
        }
      }

      function selectDept(deptName) {
        selectedDept = deptName || null;
        searchInput.value = '';
        closeSearchResults();
        searchInput.placeholder = selectedDept
          ? 'Search guides in ' + selectedDept + '…'
          : 'Search guides (e.g. "leaky faucet", "paint a room")';
        renderFilterButtons();
        render();
      }

      function closeSearchResults() {
        searchResultsEl.hidden = true;
      }

      searchInput.addEventListener('input', function () {
        var value = searchInput.value;
        if (!value.trim()) { closeSearchResults(); return; }
        var scoped = selectedDept ? searchIndex.filter(function (e) { return e.department === selectedDept; }) : searchIndex;
        var matches = searchEntries(scoped, value, 8);
        if (matches.length === 0) {
          searchResultsEl.innerHTML = '<div class="search-empty">No guides match yet. Try a different term' + (selectedDept ? ' or search all departments.' : '.') + '</div>';
        } else {
          searchResultsEl.innerHTML = matches.map(function (m) {
            return '<a class="search-result" href="' + guideUrl(m.id) + '">' +
              '<span class="search-badge search-badge-problem">How-To</span>' +
              '<span class="search-result-text">' +
                '<span class="search-result-label">' + escapeHtml(m.label) + '</span>' +
                '<span class="search-result-subtitle">' + escapeHtml(m.subtitle) + '</span>' +
              '</span>' +
            '</a>';
          }).join('');
        }
        searchResultsEl.hidden = false;
      });

      document.addEventListener('click', function (e) {
        if (!searchWrap.contains(e.target)) closeSearchResults();
      });

      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeSearchResults();
      });

      renderFilterButtons();
      render();
    }).catch(function (err) {
      console.error(err);
      outputEl.innerHTML = '<p class="detail-error">Something went wrong loading the guides.</p>';
    });
  });
})();
