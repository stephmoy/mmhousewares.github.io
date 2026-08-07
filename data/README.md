# Catalog data

This folder is fetched client-side by `catalog.html` (search), `product.html`,
and `guide.html` (detail pages).

- `taxonomy.json` — full department > category > subcategory structure (16
  departments, ~121 subcategories), mirroring the store's physical aisle
  layout.
- `products/<department>/<category>/<subcategory>.json` — the source
  product files, organized the same way products sit on the shelf.
- `all-products.json` — the same 191 products flattened into one file, for
  quick client-side lookup by id on `product.html`.
- `problems.json` — 51 "problem we're solving" / how-to guide entries, each
  tagged independently of the aisle structure.
- `search-index.json` — generated search index combining products and
  problems, used for the autosuggest search bar on `catalog.html`.
- `cross-reference.json` — computed product&harr;problem suggestions (by tag
  overlap), used to show "products that can help" on guide pages and
  "related guides" on product pages.

**All product data here is representative, not real inventory** — no real
prices, SKUs, or photos yet. Regenerate everything from source with the
Python scripts in the original catalog bundle (see the project's
`mm-housewares-catalog.zip` / `catalog/scripts/`), or hand-edit these JSON
files directly and re-run `build_search_index.py` to refresh
`search-index.json` and `cross-reference.json`.
