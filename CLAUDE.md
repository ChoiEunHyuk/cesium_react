# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start development server with HMR
npm run build    # Build for production (outputs to dist/)
npm run preview  # Preview production build locally
npm run lint     # Run ESLint on all files
```

## Architecture

This is a Vite + React 19 application using JavaScript (JSX).

### Project Structure

```
src/
├── main.jsx                    # React root setup with StrictMode
├── App.jsx                     # Router configuration (BrowserRouter)
├── index.css                   # Global styles
├── components/
│   └── Layout/
│       ├── index.js            # Re-export
│       ├── Layout.jsx          # Main layout with navigation
│       └── Layout.css
└── pages/
    ├── Map/
    │   ├── index.js            # Re-export
    │   ├── MapPage.jsx         # Map page container
    │   ├── CesiumMap.jsx       # Cesium 3D globe component
    │   └── CesiumMap.css
    └── Board/
        ├── index.js            # Re-export
        ├── BoardPage.jsx       # TODO List page
        └── BoardPage.css
```

### Routing (react-router-dom v7)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | MapPage | Cesium 지도 페이지 (기본) |
| `/board` | BoardPage | TODO LIST 페이지 |

### Key Dependencies

- **Cesium** - 3D globe/map visualization (via `vite-plugin-cesium`)
- **react-router-dom** - Client-side routing

### Configuration Files

- `index.html` - Entry point, loads `/src/main.jsx`
- `vite.config.js` - Vite configuration with @vitejs/plugin-react and vite-plugin-cesium
- `eslint.config.js` - ESLint flat config with react-hooks and react-refresh plugins

## ESLint Configuration

Uses ESLint 9 flat config format. Notable rules:
- `no-unused-vars` ignores variables starting with uppercase or underscore (pattern: `^[A-Z_]`)
- Includes react-hooks and react-refresh recommended rules
- Targets browser globals and ES2020+
