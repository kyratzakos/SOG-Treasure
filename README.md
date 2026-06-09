# SoG Treasure Index

Static, single-page index of custom treasure photos with tags, in-game coordinates, and links to solution videos. Plain HTML / CSS / JS — no build step.

## Local preview

`fetch('./data.json')` is blocked on `file://` in most browsers, so serve over HTTP:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Editing entries

All data lives in [`data.json`](data.json). Each entry:

```json
{
  "id": "100",
  "image": "model/LC_CustomTreasures_Photo100_front.png",
  "tags": ["Radio Tower", "Forest"],
  "coords": { "x": 1321, "y": 2211 },
  "video": "https://www.youtube.com/watch?v=..."
}
```

- `id` — shown in the `Photo #` column. Must be unique.
- `image` — path to the photo in `model/`.
- `tags` — any number of strings. Chips above the table are auto-built from the union of all tags.
- `coords.x` / `coords.y` — in-game map coordinates (integers).
- `video` — full URL to the solution video. Set to `""` to render a `—` instead.

The placeholder tags / coords / videos shipped in the repo are demo data — replace as needed.

## Deploying to GitHub Pages

The site will be live at `https://kyratzakos.github.io/SOG-Treasure/`.

`.nojekyll` is included so Pages serves files verbatim without Jekyll processing.

## Files

- `index.html` — page shell (header, search, chip bar, table).
- `assets/styles.css` — dark / terminal theme.
- `assets/app.js` — loads `data.json`, renders rows, handles search / tag filter / column sort.
- `data.json` — entries.
- `model/` — photo assets (unchanged).
