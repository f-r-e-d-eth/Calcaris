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

## Reuse an earlier result

Use `{2}` to substitute the result from exactly two physical lines above. Blank lines count. For example:

```text
100x2=200
50x2=100
{2}+{1}=300
```

References are evaluated top-to-bottom, and kept as `{2}` in the copied report. If a referenced line is blank, invalid, or missing, the current line shows an error and is copied unchanged.
