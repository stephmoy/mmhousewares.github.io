/* Renders a single product page from data/all-products.json + data/cross-reference.json
 * based on the ?id= query parameter. */
(function () {
  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var NEEDS_PRO = ['Plumbing', 'Electrical & Lighting', 'Locks & Security', 'Heating, Cooling & Weatherization'];

  document.addEventListener('DOMContentLoaded', function () {
    var id = qs('id');
    var contentEl = document.getElementById('product-content');
    var nameEl = document.getElementById('product-name');
    var descEl = document.getElementById('product-description');
    var breadcrumbEl = document.getElementById('product-breadcrumb');

    if (!id) {
      contentEl.innerHTML = '<p class="detail-error">No product specified. <a href="catalog.html">Back to the catalog &rarr;</a></p>';
      return;
    }

    Promise.all([
      fetch('data/all-products.json').then(function (r) { return r.json(); }),
      fetch('data/cross-reference.json').then(function (r) { return r.json(); }).catch(function () { return { product_to_problems: {} }; })
    ]).then(function (results) {
      var productData = results[0];
      var xref = results[1];
      var product = (productData.products || []).find(function (p) { return p.id === id; });

      if (!product) {
        nameEl.textContent = 'Product not found';
        contentEl.innerHTML = '<p class="detail-error">We couldn\'t find that product. <a href="catalog.html">Back to the catalog &rarr;</a></p>';
        return;
      }

      document.title = product.name + ' | MM Housewares Hardware';
      breadcrumbEl.innerHTML = escapeHtml(product.department) + ' &rsaquo; ' + escapeHtml(product.category) + ' &rsaquo; ' + escapeHtml(product.subcategory);
      nameEl.textContent = product.name;
      descEl.textContent = product.description;

      var specsHtml = '';
      var specKeys = Object.keys(product.specs || {});
      if (specKeys.length) {
        specsHtml = '<div class="detail-specs"><h3>Specs</h3><dl>' +
          specKeys.map(function (k) {
            return '<dt>' + escapeHtml(k.replace(/_/g, ' ')) + '</dt><dd>' + escapeHtml(product.specs[k]) + '</dd>';
          }).join('') + '</dl></div>';
      }

      var tagsHtml = (product.tags || []).map(function (t) {
        return '<span class="tag">' + escapeHtml(t) + '</span>';
      }).join(' ');

      var relatedIds = (xref.product_to_problems && xref.product_to_problems[id]) || [];
      var relatedHtml = '';
      if (relatedIds.length) {
        relatedHtml = '<div class="section-intro" style="margin-top:36px;"><span class="eyebrow">Related</span><h2>How-to guides using this product</h2></div>' +
          '<ul class="directory-list">' +
          relatedIds.map(function (pid) {
            return '<li class="directory-item"><a href="guide.html?id=' + encodeURIComponent(pid) + '">' + escapeHtml(pid.replace(/-/g, ' ')) + ' &rarr;</a></li>';
          }).join('') + '</ul>';
      }

      var proHtml = '';
      if (NEEDS_PRO.indexOf(product.department) !== -1) {
        proHtml = '<p style="margin-top:24px;"><a href="technicians.html" class="card-link">Not a DIY job? Find a local technician &rarr;</a></p>';
      }

      contentEl.innerHTML =
        '<p><span class="tag">' + escapeHtml(product.department) + '</span> &nbsp; <span class="detail-loading" style="padding:0;display:inline;">Aisle: ' + escapeHtml(product.aisle) + '</span></p>' +
        '<p>' + tagsHtml + '</p>' +
        specsHtml +
        proHtml +
        relatedHtml +
        '<p style="margin-top:32px;"><a href="catalog.html">&larr; Back to the full catalog</a></p>';
    }).catch(function (err) {
      console.error(err);
      contentEl.innerHTML = '<p class="detail-error">Something went wrong loading this product.</p>';
    });
  });
})();
