# NBA Doha map and hotspot manager

## Files

- `index.html` — live public map
- `styles.css` — live map styling
- `map.js` — live map behaviour
- `hotspots.json` — all hotspot content
- `manager.html` — visual editor
- `manager.css` — manager styling
- `manager.js` — manager behaviour
- `icons.js` — approved SVG icon library
- `config.js` — Mapbox token and initial map view

## Uploading the project

Upload all files to the root of the GitHub repository, replacing older versions.

Live map:
`https://bcrawfordwass.github.io/nba-doha-map/`

Manager:
`https://bcrawfordwass.github.io/nba-doha-map/manager.html`

## Normal update workflow

1. Open `manager.html`.
2. Add, edit, delete or reorder hotspots.
3. Pick an icon visually.
4. Click **Download hotspots.json**.
5. In GitHub, upload the downloaded `hotspots.json`, replacing the old one.
6. Commit the change.
7. Wait for GitHub Pages to refresh.

## Important behaviour

- The manager automatically saves draft work in that browser's local storage.
- Use **Import JSON** to load a different `hotspots.json` file.
- The live site loads `hotspots.json` each time it opens.
- Icons come from the approved list in `icons.js`; hotspot data cannot inject arbitrary SVG.
- Coordinates use `[longitude, latitude]`.

## Resetting the manager to the currently published file

Clear the site's local storage in the browser, or import the current `hotspots.json` from GitHub.
