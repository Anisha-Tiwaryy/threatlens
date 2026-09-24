# Testing

`npm test` runs 29 tests in 4 suites (Jest 30, jsdom, React Testing Library, user-event). Timers are faked where timing matters.

| Suite | What it proves |
|---|---|
| `tests/utils.test.js` (4) | debounce fires once with latest args, cancel/flush work, `this` is preserved; throttle runs leading + trailing calls |
| `tests/retry.test.js` (6) | retries 5xx then succeeds; gives up after N retries; never retries 404; backoff doubles (2, 4, 8 ms); recovers from two mock 503s; abort stops retries |
| `tests/core.test.js` (12) | prototype EventEmitter on/once/off and `class extends`; Alert immutability and risk score; undo/redo restores the exact previous instances; new action clears redo; history cap; filter/sort/paginate/stats |
| `tests/dashboard.test.jsx` (7) | presentational components render from props; 15 rows per page; search only filters after the 250 ms debounce; bulk resolve then Ctrl+Z / Ctrl+Shift+Z; lazy detail panel triage + Undo button; error state with Try again |

Coverage: 88.5% statements, 91.4% lines.

## Bugs found while building (and fixed)

1. **Blank page in the production build.** Babel 8's React preset emitted the development JSX runtime (`jsxDEV`), which the production React build does not export, so the page threw `jsxDEV is not a function`. Tests passed because Jest runs development React. Caught only by loading the real `dist/` build in a headless browser; fixed by setting `development: false` in `babel.config.js`. Lesson: test the shipped bundle, not just the source.
2. **CSS Modules returned `undefined` class names.** css-loader 7 switched CSS Modules to named exports by default, so `import styles from "./X.module.scss"` was empty. Fixed with `namedExport: false` in the loader options.
3. **Detail panel squeezed the table.** With the panel open at 1440px the Risk and Status columns were pushed off screen. Fixed by treating an open panel as "compact" mode below 1600px.

## Manual checks (headless Chromium via Playwright)

- Production build loads with zero console errors at `/` and under a `/threatlens/` subpath (GitHub Pages layout), including the lazy detail chunk.
- Flaky mode shows "attempt 2, retrying after a 503" and then loads.
- 390px mobile width renders stat tiles in two columns and scrolls the table horizontally.
