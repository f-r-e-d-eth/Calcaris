# Calcaris

Minimal engineering-report calculator for multiple lines.

- One calculation per line, ignoring notes in square brackets.
- Treats a leading `=` as optional, and anything after a subsequent `=` as a previous result.
- Accepts `x`, `X`, `×` and `*` for multiplication.
- Supports `+ - * / ^`, parentheses, `sin cos tan` in degrees, `sqrt abs pi`.
- Calculations are performed in the browser using a restricted parser (no `eval`).
- Copy results with preserved line order; no data is sent to a server.
- Portaris logout link: `/_gate/logout`.

## Example

```
12[t roll] x 10[kN/t] / 2[sides] = 60
sin(30°) x 100 = 50
= 400 + 1 = 401
```

Open `index.html` locally to test. When deployed under `/calc/`, keep `index.html`, `calculator.js`, and `background.svg` together. Configure Portaris/Caddy to authorize both page and assets.

MIT License.
