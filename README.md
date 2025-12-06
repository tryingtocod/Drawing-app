# Drawing App

This is a small browser-based drawing application.

Project structure

- `src/` - application source files
  - `index.html` - main page (open this to run the app)
  - `app.js` - main JavaScript logic (drawing, undo/redo, save/load)
  - `style.css` - application styles

Quick start

1. From the project root, start a simple HTTP server and open the app in your browser:

```powershell
cd 'C:\Users\saram\OneDrive\Projetos\Drawing-app'
python -m http.server 8000
# then open http://localhost:8000/src/index.html
```

Alternatively you can use `npm` to run a local server (no global install required):

```powershell
cd 'C:\Users\saram\OneDrive\Projetos\Drawing-app'
# runs http-server using npx (will download/run automatically)
npm start
# then open http://localhost:8000/src/index.html
```

2. Use the toolbar to draw, change color/size, toggle smoothing, save PNG, or save/load project files.

Notes

- The app supports autosave (stored in browser `localStorage`) and project export/import as JSON containing a PNG data URL.
- If you prefer direct file access in Chromium browsers, I can add File System Access API support to read/write project files directly.
