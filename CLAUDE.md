# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server with HMR (host 0.0.0.0, port 5173)
npm run build    # Production build into dist/
npm run preview  # Serve the production build locally
npm run lint     # Lint with oxlint (config in .oxlintrc.json)
```

There is no test runner configured. Linting is via **oxlint**, not ESLint —
enforced rules are `react/rules-of-hooks` (error) and `react/only-export-components` (warn).

Requires `.env` with `VITE_API_BASE_URL` (defaults to `http://localhost:8089`,
matching the Spring Boot API's `server.port`). Copy from `.env.example`.

## Architecture

React 19 + Vite SPA frontend for the **CricHub** Spring Boot API. There is no
local state store or backend in this repo — every screen is a view over remote
API data, and all persistence (JWT + session) lives in `localStorage`.

**API layer (`src/api/`)** — the spine of the app.
- `client.js` is the single fetch wrapper. Everything goes through `api.get/post/put/del`.
  - Success bodies are a `ResponseBean` envelope `{ success, message, statusCode, data }`;
    `apiRequest` **unwraps and returns `data`** (callers never see the envelope). A 2xx
    carrying `success: false` is still treated as a failure.
  - Failures are **not uniformly shaped** — the backend's `GlobalExceptionHandler` returns
    a bare string for some errors and a JSON object (with `message` and sometimes a
    per-field `errors` map) for others. `parseError` normalises both into an **`ApiError`**
    carrying `message`, `status`, and `fieldErrors` (field → validation message map).
  - JWT from `tokenStore` is auto-attached as `Authorization: Bearer` unless a call passes
    `{ auth: false }` (used only by signup/login).
- `auth.js` also owns `sessionStore` and defines enum option lists. **`PLAYING_ROLES` mirrors
  the backend enum** `com.as.crichub.enums.PlayingRole` and its values must match. `BATTING_STYLES`
  / `BOWLING_STYLES` are frontend-only conveniences — the backend stores those as free strings.
- `teams.js`, `squad.js`, `players.js` are thin per-resource wrappers; each function maps to
  one endpoint and is documented with its HTTP method and path.

**Auth (`src/auth/`)** — split deliberately across two files for React Fast Refresh:
`AuthContext.js` (non-component: context + `useAuth` hook) and `AuthProvider.jsx` (the provider
holding `user` in React state). `api/auth.js` is the source of truth for persistence; the provider
just mirrors it into the tree so navbar/routes re-render on sign in/out. Note: `signOut` does a
**hard `window.location.assign('/')`** on purpose — an SPA route change there races
`ProtectedRoute` into a redirect-to-login flash.

**Routing (`src/App.jsx`, `src/main.jsx`)** — `BrowserRouter` → `AuthProvider` → `App`.
Authenticated routes (`/dashboard`, `/profile`, `/teams`, `/teams/:teamId/squad`) are wrapped in
`<ProtectedRoute>`, which redirects signed-out users to `/login` and stashes the intended
destination in `location.state.from` so login can return them.

**Pages (`src/pages/`)** follow a consistent data-fetching pattern worth matching in new pages:
a single `useState` holding `{ status: 'loading' | 'ready' | 'error', ...data, error }`, a
`useCallback` loader invoked from `useEffect` with an `AbortController` (loader checks
`signal?.aborted` before setting state). Forms catch `ApiError`, route `error.fieldErrors` into
per-field messages, and fall back to `error.message` for the form-level error.

**Labels (`src/lib/playerLabels.js`)** — since the API returns raw enum-ish values (and free
strings for batting/bowling style), use `roleLabel` / `batLabel` / `bowlLabel` to render them;
they prefer the form's human labels and fall back to `humanize()`.

Each page owns a co-located `.css` file (e.g. `Teams.jsx` + `Teams.css`); shared styling and
CSS variables live in `src/index.css`.

## Photographs

Images in `public/images/` are Unsplash-licensed and served from the repo (no hotlinking).
Each is credited via the `Figure` component, which reads metadata from `src/data/photos.js`.
To swap an image, drop the file in `public/images/` and update its entry in **both**
`src/data/photos.js` and `public/images/CREDITS.json`.
