# neinainoi-site

The brief is CLAUDE.md. Read it first.

## holding page

`holding/` is plain static HTML. `functions/api/` holds the signup endpoints, `lib/signup.js`
the logic, `db/schema.sql` the list table. `npm test` runs the signup tests.

Local preview of the page only: `cd holding && python3 -m http.server 8000`.

### Cloudflare Pages

- Connect this repo. Framework preset: None. Build command: empty. Build output directory:
  `holding`. Root directory: empty (the repo root, so `functions/` is found).
- D1: create a database `neinainoi-signup`, run `db/schema.sql` in its console, and bind it
  to the Pages project as `DB`.
- Secret: `RESEND_API_KEY`, from a Resend account with neinainoi.com verified.
- Custom domain: neinainoi.com.

To export the list at launch: in the D1 console run
`SELECT email, confirmed_at FROM subscribers WHERE status = 'confirmed';` and download CSV.

## film

`holding/media/series-001.*` are web versions of
`assets/source/images & videos/black_n_white.mov` at its native 588 x 1046: audio removed,
H.264 MP4 first (hardware decoded on every phone), VP9 WebM as fallback. The poster is
frame 0, so nothing jumps when playback starts.
