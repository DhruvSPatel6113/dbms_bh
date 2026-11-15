# Client Source Directory (`client/src/`)

## 1. Directory Purpose & Scope
This directory contains the root application modules for the React Single Page Application. It orchestrates React Router routing hierarchies, global query client caching providers, authentication boundaries, and application layouts.

## 2. Directory Contents
- `main.jsx`: Application DOM bootstrap, React Query provider, and browser router mounting.
- `App.jsx`: Global authentication routing gate and route definitions.
- `index.css`: Global Tailwind CSS rules and typography styles.
- `api/`: Central Axios client, JWT authorization interceptor, and API service functions.
- `components/`: Modular presentation components, navigations, sidebars, and modals.
- `pages/`: Dedicated management views (Books, Members, Circulation, Fines, Staff, Software, Reports, Profile).
- `hooks/`: Custom data fetching hooks wrapping TanStack React Query.
- `readme.md`: Scope and client source mapping.
- `implementation.md`: Routing mechanics, session state preservation, and view hierarchies.
