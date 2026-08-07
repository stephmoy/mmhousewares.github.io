# mmhousewares.github.io
MM Houseware Hardware Store Directory
# MM Housewares Hardware — Website

Plain HTML/CSS site for MM Housewares Hardware (Queens, NY), built for hosting on GitHub Pages via the `stephmoy/mmhousewares.github.io` repository.

## Structure

```
index.html          Homepage
catalog.html         Product catalog, organized by the problem being solved
guides.html          How-to guides (anchored sections match catalog links)
technicians.html     Local technician directory
careers.html         Vocational schools, certificate programs, mentors
css/style.css        Shared styles for all pages
```

All content is placeholder / sample data — products, technicians, schools, phone numbers, and prices are not real. Replace before publishing.

## Publishing to GitHub Pages

Since the repo is already named `mmhousewares.github.io`, GitHub Pages will serve it automatically from the root of the `main` branch — no extra config needed.

1. Copy these files into your local clone of `mmhousewares.github.io` (or drag-and-drop them into the repo on github.com).
2. Commit and push to the `main` branch:
   ```
   git add .
   git commit -m "Initial site build"
   git push origin main
   ```
3. In the repo on GitHub, go to **Settings → Pages** and confirm the source is set to the `main` branch, root folder. (For a `username.github.io` repo this is usually already the default.)
4. Your site will be live at `https://stephmoy.github.io/mmhousewares.github.io/` within a minute or two — check the Pages settings for the exact URL.

## Next steps

- Swap sample products, technicians, and program listings for real ones.
- Add the  store address, hours, and phone number in the footer (appears on every page).
- Add real photos (an `images/` folder works well) and update `<img>` tags where you want them.
- Consider a custom domain later via the same Pages settings if you want something other than the default `github.io` URL.
