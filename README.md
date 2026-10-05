# neinainoi-site

The brief is CLAUDE.md. Read it first.

## holding page

`holding/` is plain static HTML. No build step.

Local preview: `cd holding && python3 -m http.server 8000`, then open http://localhost:8000.

Deploy on Cloudflare Pages: connect this repo, framework preset "None", build command empty,
output directory `holding`. Add the custom domain neinainoi.com.

Before it goes live, replace `BUTTONDOWN_USERNAME` in `holding/index.html` with the
Buttondown username.

## film

`holding/media/series-001-*` are web versions of `assets/source/images & videos/IMG_0783.mov`:
tone mapped from iPhone HDR to SDR, audio removed, VP9 WebM and H.264 MP4 at 720 and 1080.
