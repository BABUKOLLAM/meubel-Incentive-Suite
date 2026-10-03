# Meubel & Royal incentive board

Single-file web app: `index.html` holds the styles, the generated sample universe, the incentive engine, every
view, the messages, the settings window and the admin console. There is no build step and no dependency.

## Working rules

- Run `node test/render.test.js` before every commit. It renders every view under every role with a stub DOM
  and fails on any exception, NaN or undefined; it also checks badges, stale-state handling, the month snapshot,
  statements and the CSV exports. Keep it green and extend it when you add a view or a message.
- The script is plain browser JavaScript inside one `<script>` block. Keep function declarations (they hoist)
  and keep new engine code in section order: constants, universe, computation, messages, views, settings, admin.
- Anything that touches `document` or `window` at load time must be guarded for the stub DOM in the test
  (see the Escape key listener for TV mode).
- Policy values live in `P`, `W`, `POOL`, `GATES`, `CATS`, `BANDS`, `POLICY`, `PRED`; never hard-code a
  rupee or a percentage in a view. Gamification (badges, medals, movement) never changes a payout.
- Browser state keys are prefixed `mr-`; add new ones to the README's settings section.
- Commit messages: a one-line summary, then what changed and why. No model identifiers in commits or code.
- This repository is independent of any other Bpro project; do not copy files to or from other repositories.

## Checks that mirror CI

```
node -e "const fs=require('fs');const h=fs.readFileSync('index.html','utf8');fs.writeFileSync('board.js',h.match(/<script>([\s\S]*)<\/script>/)[1])" && node --check board.js
node test/render.test.js
```
