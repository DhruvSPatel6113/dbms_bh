# Client Frontend Application Directory (`client/`)

## 1. Directory Purpose & Scope
This directory contains the Single Page Application (SPA) frontend developed with **React 18**, **Vite**, **React Router v6**, **TanStack Query (React Query)**, and **Tailwind CSS**. It provides an intuitive, responsive interface for librarians and administrators to manage circulation, cataloging, fines, staff rosters, and software license alerts.

Tailwind scans `index.html` and `src/` through `tailwind.config.cjs`; Vite processes the utility styles through `postcss.config.cjs`.

## 2. Directory Contents
```
client/
|-- package.json            # React, Vite, TanStack Query, and Axios dependencies
|-- vite.config.js          # Vite configuration with /api reverse proxy to Express
|-- index.html              # HTML entry point mounted by Vite
|-- tailwind.config.cjs     # Tailwind utility-class scanning and theme
|-- postcss.config.cjs      # Tailwind and Autoprefixer processing
|-- readme.md               # Scope and frontend structure
|-- implementation.md       # Frontend state management, caching, and auth lifecycles
`-- src/                    # Source code (API client, UI components, pages, hooks)
```

## 3. Execution Commands
```bash
# Install frontend dependencies
npm install

# Start Vite development server with hot-module replacement
npm run dev

# Compile optimized static production build
npm run build
```
