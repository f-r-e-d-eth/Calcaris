"use strict";
// No eval/Function. Expressions are parsed using a restricted recursive-descent grammar.
function calculateLine(source) {
  let s = source.replace(/\[[^\]]*\]/g, "").trim();
  if (!s) return null;
  s = s.replace(/^=\s*/, "");
  const equals = s.indexOf("=");
  if (equals !== -1) {
    if (s.indexOf("=", equals + 1) !== -1) throw Error("Ambiguous equals signs");
    s = s.slice(0, equals).trim();
  }
  if (!s) throw Error("Missing expression");
  s = s.replace(/(\d)[ \u00a0\u202f]+(?=\d)/g, "$1");
  s = s.replace(/,/g, ".").replace(/[×xX]/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
  const tokens = s.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[a-zA-Z]+|[+*/^()°-]/g) || [];
  if (tokens.join("") !== s.replace(/\s+/g, "")) throw Error("Unsupported character");
  let i = 0;
  const peek = () => tokens[i];
  const take = t => { if (peek() === t) { i++; return true; } return false; };
  function atom() {
    if (take("+")) return atom();
    if (take("-")) return -atom();
    if (take("(")) {
      const v = sum();
      if (!take(")")) throw Error("Missing )");
      return v;
    }
    const t = tokens[i++];
    if (!t) throw Error("Missing value");
    if (/^(?:\d|\.)/.test(t)) {
      const value = Number(t);
      if (take("°")) return value; // Trigonometric arguments use degrees.
      return value;
    }
    if (t.toLowerCase() === "pi") return Math.PI;
    const functions = {
      sin: x => Math.sin(x * Math.PI / 180),
      cos: x => Math.cos(x * Math.PI / 180),
      tan: x => Math.tan(x * Math.PI / 180),
      sqrt: Math.sqrt, abs: Math.abs
    };
    const fn = functions[t.toLowerCase()];
    if (!fn || !take("(")) throw Error("Unknown function or missing (");
    const value = sum();
    if (!take(")")) throw Error("Missing )");
    return fn(value);
  }
  function power() {
    const base = atom();
    return take("^") ? Math.pow(base, unary()) : base;
  }
  function unary() {
    if (take("+")) return unary();
    if (take("-")) return -unary();
    return power();
  }
  function product() {
    let value = unary();
    while (peek() === "*" || peek() === "/") {
      const op = tokens[i++];
      const rhs = unary();
      value = op === "*" ? value * rhs : value / rhs;
    }
    return value;
  }
  function sum() {
    let value = product();
    while (peek() === "+" || peek() === "-") {
      const op = tokens[i++];
      const rhs = product();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }
  const value = sum();
  if (i !== tokens.length) throw Error("Unexpected input");
  if (!Number.isFinite(value)) throw Error("Non-finite result");
  return Number(value.toPrecision(12)).toString();
}

function updateLine(source, resolvedSource = source) {
  if (!source.trim()) return { text: source, result: null };
  const result = calculateLine(resolvedSource);
  if (result === null) return { text: source, result: null };
  let separator = source.indexOf("=");
  if (separator !== -1 && !source.slice(0, separator).trim())
    separator = source.indexOf("=", separator + 1);
  const expression = source.slice(0, separator < 0 ? source.length : separator).replace(/\[[^\]]*\]/g, "");
  const formatted = expression.includes(",") ? result.replace(".", ",") : result;
  if (separator < 0) return { text: source + " = " + formatted, result };
  const tail = source.slice(separator + 1);
  const old = tail.match(/^(\s*)([+-]?(?:(?:\d[\d \u00a0\u202f]*(?:[.,]\d+)?|[.,]\d+)(?:[eE][+-]?\d+)?))/);
  if (!old) throw Error("Old result must start with a number");
  return { text: source.slice(0, separator + 1) + old[1] + formatted + tail.slice(old[0].length), result };
}

// References count physical lines, including blank lines.
// The original {n} remains in the report; only evaluation substitutes its value.
function evaluateBlock(text) {
  const lines = text.split(/\r?\n/);
  const prior = [];
  return lines.map((source, i) => {
    try {
      // Never substitute references contained in old results or comments.
      let separator = source.indexOf("=");
      if (separator >= 0 && !source.slice(0, separator).trim())
        separator = source.indexOf("=", separator + 1);
      const head = separator < 0 ? source : source.slice(0, separator);
      const resolvedHead = head.replace(/\{([^{}]*)\}/g, (_, raw) => {
        if (!/^[1-9]\d*$/.test(raw)) throw Error("Invalid line reference");
        const offset = Number(raw);
        if (!Number.isSafeInteger(offset) || offset > i) throw Error("Reference outside previous lines");
        const value = prior[i - offset];
        if (value === null) throw Error("Referenced line has no valid result");
        return "(" + value + ")";
      });
      const resolved = resolvedHead + (separator < 0 ? "" : source.slice(separator));
      const line = updateLine(source, resolved);
      prior.push(line.result);
      return line;
    } catch (e) {
      prior.push(null);
      return { text: source, result: null, error: e.message };
    }
  });
}
if (typeof module !== "undefined") module.exports = {calculateLine, updateLine, evaluateBlock};
if (typeof document !== "undefined") {
  const input = document.getElementById("input");
  const output = document.getElementById("results");
  let copyText = "";
  function update() {
    output.replaceChildren();
    const updated = [];
    const sources = input.value.split(/\r?\n/);
    const calculated = evaluateBlock(input.value);
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      const line = calculated[i];
      const result = line.error ? "Error: " + line.error : line.result;
      updated.push(line.text);
      if (result === null) continue;
      const row = document.createElement("div");
      row.className = "line";
      const expr = document.createElement("span");
      expr.className = "expr";
      expr.textContent = source;
      const answer = document.createElement("span");
      answer.className = "result" + (result.startsWith("Error:") ? " error" : "");
      answer.textContent = result;
      row.append(expr, answer);
      output.append(row);
    }
    copyText = updated.join("\n");
  }
  input.addEventListener("input", update);
  document.getElementById("copy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(copyText); }
    catch { alert("Clipboard unavailable; select and copy results manually."); }
  });
  update();
}
