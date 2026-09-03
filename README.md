# Art Resource Tracker

A self-hosted board for the sticker/art/game business: **Art Fairs** (editable tracker), **Channels** (posting/feedback reference), and a **Calendar** (drag-free event board with date ranges, hover details, add/edit/delete).

Built with Vite + React. Data persists to a **private GitHub Gist** (same pattern as `wedder`), so it syncs across your devices with no server to run.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173/ART/
npm run build      # production build into dist/
```

## Data & sync (gist-backed)

On first load you choose:

- **Start on this device** — data lives in this browser's `localStorage` only.
- **Sync with GitHub** — create a Personal Access Token with **`gist`** scope
  (the setup screen links straight to the token page), then either create a new
  private gist or point it at an existing one. Your board is saved to a file
  called `art-data.json` inside that gist.

How sync behaves (mirrors `wedder`):

- Every change saves to `localStorage` instantly, then pushes to the gist on a
  **5-minute debounce** (or immediately via **↑ Sync now**).
- If the app reloads with unsynced local changes, it shows a **local-vs-gist
  conflict picker** — you choose which version wins.
- Conflict model is **last-write-wins**. Fine for one person on a few devices;
  two people editing at the same moment can clobber each other. See
  `wedder/docs/collaborative-editing.md` for the real-time upgrade paths.

### Security note
The token is stored in your browser's `localStorage`, unencrypted. A **`gist`-scoped
token can read and write *all* your gists**, not just this one — so don't paste it on
a shared/public machine, and revoke it from GitHub settings if a device is lost.

## Deploy (GitHub Pages)

1. Create a repo named **`ART`** (the name must match `base` in
   `vite.config.js`; change both together if you rename).
2. Commit everything **including `package-lock.json`** (the Actions workflow runs
   `npm ci`, which requires it).
3. Push to `main`. `.github/workflows/deploy.yml` builds and publishes `dist/` to
   the `gh-pages` branch.
4. In repo **Settings → Pages**, set source to the `gh-pages` branch.

Live URL: `https://<your-username>.github.io/ART/`

## Structure

```
src/
  data/
    defaults.js      seed data (empty fairs, 5 starter challenges, channel reference)
    gistStorage.js   GitHub Gist create/load/save + credential helpers
    storage.js       localStorage mirror + migrate
  components/
    GistSetup.jsx    first-run: guest vs GitHub connect
    FairsTab.jsx     editable fairs table
    ChannelsTab.jsx  static channel reference
    CalendarTab.jsx  month calendar: event bars, tooltips, add/edit form
  App.jsx            sync orchestration (load / debounce / conflict / guest)
```
