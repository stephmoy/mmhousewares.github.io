/* Renders a single how-to guide page from data/problems.json + data/all-products.json
 * based on the ?id= query parameter. */
(function () {
  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var id = qs('id');
    var contentEl = document.getElementById('guide-content');
    var titleEl = document.getElementById('guide-title');
    var descEl = document.getElementById('guide-description');
    var eyebrowEl = document.getElementById('guide-eyebrow');

    if (!id) {
      contentEl.innerHTML = '<p class="detail-error">No guide specified. <a href="guides.html">Back to how-to guides &rarr;</a></p>';
      return;
    }

    Promise.all([
      fetch('data/problems.json').then(function (r) { return r.json(); }),
      fetch('data/cross-reference.json').then(function (r) { return r.json(); }).catch(function () { return { problem_to_products: {} }; }),
      fetch('data/all-products.json').then(function (r) { return r.json(); }).catch(function () { return { products: [] }; })
    ]).then(function (results) {
      var problems = results[0].problems || [];
      var xref = results[1];
      var allProducts = results[2].products || [];
      var problem = problems.find(function (p) { return p.id === id; });

      if (!problem) {
        titleEl.textContent = 'Guide not found';
        contentEl.innerHTML = '<p class="detail-error">We couldn\'t find that guide. <a href="guides.html">Back to how-to guides &rarr;</a></p>';
        return;
      }

      document.title = problem.how_to_guide.title + ' | MM Housewares Hardware';
      eyebrowEl.textContent = problem.department + ' · ' + problem.difficulty;
      titleEl.textContent = problem.how_to_guide.title;
      descEl.textContent = problem.description;

      var topicsHtml = '';
      if (problem.how_to_guide.topics_covered && problem.how_to_guide.topics_covered.length) {
        topicsHtml = '<div class="section-intro"><span class="eyebrow">This guide will cover</span></div><ul>' +
          problem.how_to_guide.topics_covered.map(function (t) {
            return '<li>' + escapeHtml(t) + '</li>';
          }).join('') + '</ul>' +
          '<div class="placeholder-note">This is a guide outline generated from the catalog data. Replace with the real step-by-step write-up, photos, or video before publishing.</div>';
      }

      var productIds = (xref.problem_to_products && xref.problem_to_products[id]) || [];
      var products = productIds.map(function (pid) {
        return allProducts.find(function (p) { return p.id === pid; });
      }).filter(Boolean);

      var productsHtml = '';
      if (products.length) {
        productsHtml = '<div class="section-intro" style="margin-top:36px;"><span class="eyebrow">Shop this project</span><h2>Products that can help</h2></div><div class="card-grid">' +
          products.map(function (p) {
            return '<div class="card"><span class="tag">' + escapeHtml(p.category) + '</span><h3>' + escapeHtml(p.name) + '</h3>' +
              '<p>' + escapeHtml(p.description) + '</p>' +
              '<a href="product.html?id=' + encodeURIComponent(p.id) + '" class="card-link">View product &rarr;</a></div>';
          }).join('') + '</div>';
      }

      var proHtml = '';
      if (problem.connect_a_technician) {
        proHtml = '<p style="margin-top:32px;"><a href="technicians.html" class="card-link">Bigger than a DIY fix? Find a local technician &rarr;</a></p>';
      }

      contentEl.innerHTML = topicsHtml + productsHtml + proHtml +
        '<p style="margin-top:32px;"><a href="guides.html">&larr; Back to all how-to guides</a></p>';
    }).catch(function (err) {
      console.error(err);
      contentEl.innerHTML = '<p class="detail-error">Something went wrong loading this guide.</p>';
    });
  });
})();
