# Escalator Ending

A tiny survival game. Hold to run; tap faster as your legs tire.

## Play

- Hold the screen or Space to run; tap faster to fight fatigue.
- Three rapid taps trigger a burst.
- Press **P** to pause. Use **♪** to toggle sound.

## Local development

Node.js 20+: `npm run dev`, then open http://127.0.0.1:5173.
Run tests with `npm test`. No dependency installation is needed.

## GitHub Pages

Ready for static hosting: `index.html`, `styles.css`, and `src/`. No build step or backend is required; `server.js` is only for local development.

In **Settings → Pages**, choose **Deploy from a branch**, select your branch and **/(root)**, then save. Relative asset paths support repository subpaths. `.nojekyll` bypasses Jekyll processing. See [GitHub's setup guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

[Implementation notes](docs/IMPLEMENTATION.md)
