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

- `index.html` - Entry point, loads `/src/main.jsx`
- `src/main.jsx` - React root setup with StrictMode
- `src/App.jsx` - Main application component
- `vite.config.js` - Vite configuration with @vitejs/plugin-react
- `eslint.config.js` - ESLint flat config with react-hooks and react-refresh plugins

## ESLint Configuration

Uses ESLint 9 flat config format. Notable rules:
- `no-unused-vars` ignores variables starting with uppercase or underscore (pattern: `^[A-Z_]`)
- Includes react-hooks and react-refresh recommended rules
- Targets browser globals and ES2020+
