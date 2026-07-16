# CricHub UI

React + Vite frontend for the CricHub API (Spring Boot).

## Getting started

```bash
npm install
cp .env.example .env   # then edit if your API isn't on :8089
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

## Configuration

`VITE_API_BASE_URL` points at the Spring Boot API — `http://localhost:8089` by
default, matching `server.port` in `application.properties`. The API already
allows all CORS origins, so no dev proxy is needed.

## Layout

```
src/
  api/
    client.js      fetch wrapper: ResponseBean envelope, JWT header, error normalising
    auth.js        /api/auth/signup and /api/auth/login
  components/      Navbar, Footer, Figure
  data/photos.js   photograph metadata + credits
  pages/           Home, Placeholder
public/images/     photographs (+ CREDITS.json)
```

## Photographs

The eight photographs in `public/images/` are Unsplash-licensed and served from
this repo rather than hotlinked, so the page has no third-party runtime
dependency. Each is credited where it appears, via the `Figure` component, which
reads its metadata from `src/data/photos.js`.

`Figure` renders the image inside a `.figure__frame` wrapper. Anything passed as
`children` is positioned against that frame — the image alone — so overlays never
collide with a caption that has wrapped onto a second line. Size overlays
yourself; only `.figure__img` is stretched to fill the frame.

To swap an image, drop a new file into `public/images/` and update its entry in
both `src/data/photos.js` and `public/images/CREDITS.json`.

### Talking to the API

Successful responses are a `ResponseBean` (`{ success, message, statusCode, data }`);
`apiRequest` unwraps and returns `data`. Failures are **not** uniformly shaped —
`GlobalExceptionHandler` returns a bare string for some exceptions and a JSON
object for others — so errors are normalised into an `ApiError` carrying
`message`, `status`, and a `fieldErrors` map when validation fails.

```js
import { login } from './api/auth'
import { ApiError } from './api/client'

try {
  const session = await login({ email, password }) // JWT is stored automatically
} catch (err) {
  if (err instanceof ApiError) console.error(err.message, err.fieldErrors)
}
```

## Status

The home page is complete. `/login` and `/signup` are placeholder screens — the
API layer for both endpoints is already written, only the forms are missing.
