# Portfolio catalog

Regenerate from the original source tree (Pillow required):

```sh
python scripts/build_catalog.py
python -m unittest discover -s tests -p 'catalog*.py' -v
```

The generator reads the project tree from `../Kumpulan` (override with
`PORTFOLIO_SOURCE=<path>`) because `Website/` and `Apps/` were moved out of this folder to keep
the portfolio small. Generated URLs are written relative to THIS folder, so a project entry looks
like `../Kumpulan/Website/Food%20And%20Beverage/Bun%20Pao/index.html`.

- `catalog.json` is the authoritative generated data.
- `catalog.js` assigns the identical object to `window.PORTFOLIO_DATA`, so a regular script tag works from `file://` without fetch.
- `catalog-report.json` contains programmatic counts, every exclusion, image provenance, URL fallback evidence, and APK search results.
- Categories preserve the real directory names and include empty categories plus `emptyMessage` and `ctaLabel` for the UI.
- Items contain `nama`, `url`, `thumbnail`, `localUrl`, `sourceFolder`, `urlType`, `thumbnailKind`, `thumbnailLabel`, and `thumbnailSource`.
- `thumbnailKind: source-image` means an actual project photo or artwork, **not a screenshot**. `screenshot` denotes a pre-existing screenshot file, not a newly rendered preview. `placeholder` is explicitly marked preview-unavailable artwork.
- Local URLs are URL-encoded relative HTML paths pointing at `../Kumpulan/Website/...` (see `projectBase`). Keep the `Kumpulan` folder next to the portfolio, or set `window.PORTFOLIO_PROJECT_BASE` in `index.html` to a host that serves those files. These are real source demos; their external fonts, images, APIs, or backend features are not certified offline.
- `sourceFolder` and the report's `sourceFolder`/`entrypoint` fields stay relative to the SOURCE root (`Website/...`, `Apps/...`), not to the portfolio, so provenance does not change when the files move.
- `portrait` points to the resized, orientation-corrected original portrait, without cropping.
- `app.image`, `app.icon`, and `app.artwork` point to optimized original MakeMeSmart branding, not fabricated app screenshots.
- MakeMeSmart is an Android **student task planner**, as verified in Kotlin source. It is not described as an AI tutor or quiz app.
- **No APK was present in the supplied project.** `app.download` and `app.iosDownload` are null, `downloadAvailable` is false, and the label is `Android APK unavailable`. Do not render a live download link when the value is null. The generator will copy a future valid local APK to `downloads/MakeMeSmart.apk` after ZIP-integrity/manifest/DEX checks. It does not build the app or verify Android signing/installability.

Generation only writes `data/`, `assets/`, and (if a valid APK exists) `downloads/`. Original source images and project files are never overwritten.
