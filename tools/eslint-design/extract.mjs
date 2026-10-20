/**
 * Finds class strings in an ESTree (typescript-eslint) AST.
 *
 * Sinks:
 * - JSX `className`, `class`, `*ClassName`, and `classNames` / `*ClassNames` (object values)
 * - `cn()`, `clsx()`, `cx()`, `classNames()`, `twMerge()`, `twJoin()` arguments (object keys)
 * - `cva(base, { variants, compoundVariants })` (defaultVariants is skipped: variant names)
 * - variables, default params, object properties and functions (their return values) named
 *   like `fooClassName`, `fooClasses`, `iconClass`, `getToneClass`, `COLOR_CLASSES`
 * - class-string constants: a same-file `const x = "…"` whose name is used inside a sink
 *   (`cn(statsGroupShell, …)`, `className={TILE_SURFACE}`), and top-level SCREAMING_CASE string
 *   constants made only of class-like tokens (exported chrome strings such as
 *   `MOBILE_GLASS_SURFACE`, used from other files)
 *
 * Inside a sink, strings, template literal quasis, both arms of `?:`, the right side of `&&`,
 * both sides of `||` / `??`, and array elements are class text. Calls are not followed: a nested
 * `cn()` is its own sink, and an unknown call (`formatLabel("...")`) is not class text.
 */

const CLASS_FUNCS = new Set(["cn", "clsx", "cx", "classNames", "twMerge", "twJoin"]);
const ATTR_RE = /^(?:class|className|[A-Za-z]+ClassName)$/;
const ATTR_MAP_RE = /^(?:classNames|[A-Za-z]+ClassNames)$/;
const NAME_RE = /(?:(?:^c|C)lass(?:Name)?(?:e?s)?|(?:^|_)CLASS(?:_?NAMES?|ES)?)$/;
const SCREAMING_RE = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;
const BARE_UTILITIES = new Set(
  "flex grid block inline hidden contents table relative absolute fixed sticky static isolate border rounded shadow ring outline uppercase lowercase capitalize truncate italic underline transition grow shrink group peer container invisible visible".split(" "),
);

/** True when a token reads like a Tailwind class (`md:hover:bg-x/10`, `[&>svg]:size-4`, `flex`). */
export function looksLikeClass(token) {
  const t = token.replace(/\[[^\]]*\]/g, "[]").replace(/\([^)]*\)/g, "()");
  if (!/^[!@a-z0-9[*&-]/.test(t) || !/^[a-z0-9\-:/.\[\]()%!@&>*+_,#=~]+$/.test(t)) return false;
  return /[-:[]/.test(t) || BARE_UTILITIES.has(t.replace(/^!|!$/g, ""));
}

/** A top-level SCREAMING_CASE string constant that is plainly a class list (2+ class-like tokens). */
function isClassConstant(init) {
  const node = unwrap(init);
  let text;
  if (node?.type === "Literal" && typeof node.value === "string") text = node.value;
  else if (node?.type === "TemplateLiteral") text = node.quasis.map((q) => q.value.cooked ?? "").join(" ");
  else return false;
  const tokens = text.split(/\s+/).filter(Boolean);
  return tokens.length >= 2 && tokens.every(looksLikeClass) && tokens.some((t) => t.includes("-"));
}

function unwrap(node) {
  while (
    node &&
    (node.type === "TSAsExpression" ||
      node.type === "TSSatisfiesExpression" ||
      node.type === "TSNonNullExpression" ||
      node.type === "TSTypeAssertion" ||
      node.type === "ParenthesizedExpression" ||
      node.type === "ChainExpression")
  ) {
    node = node.expression;
  }
  return node;
}

function keyName(prop) {
  if (prop.computed) return prop.key.type === "Literal" && typeof prop.key.value === "string" ? prop.key.value : null;
  if (prop.key.type === "Identifier") return prop.key.name;
  if (prop.key.type === "Literal" && typeof prop.key.value === "string") return prop.key.value;
  return null;
}

/**
 * Collects class-text nodes reachable from `node`.
 * `objects`: "keys" (clsx object syntax: keys are classes) or "values" (maps of class strings).
 */
function collect(node, objects, out) {
  node = unwrap(node);
  if (!node) return;
  switch (node.type) {
    case "Literal":
      if (typeof node.value === "string") out.push(node);
      return;
    case "TemplateLiteral":
      out.push(node);
      for (const expr of node.expressions) collect(expr, objects, out);
      return;
    case "ConditionalExpression":
      collect(node.consequent, objects, out);
      collect(node.alternate, objects, out);
      return;
    case "LogicalExpression":
      if (node.operator !== "&&") collect(node.left, objects, out);
      collect(node.right, objects, out);
      return;
    case "ArrayExpression":
      for (const el of node.elements) {
        if (!el) continue;
        collect(el.type === "SpreadElement" ? el.argument : el, objects, out);
      }
      return;
    case "ObjectExpression":
      for (const prop of node.properties) {
        if (prop.type !== "Property") continue;
        if (objects === "keys") {
          if (prop.key.type === "Literal" && typeof prop.key.value === "string") out.push(prop.key);
          else if (!prop.computed && prop.key.type === "Identifier") out.push({ type: "IdentifierKey", node: prop.key, shorthand: prop.shorthand });
          else if (prop.computed) collect(prop.key, objects, out);
        } else {
          collect(prop.value, objects, out);
        }
      }
      return;
    case "Identifier":
      out.push({ type: "Ref", name: node.name });
      return;
    default:
      return;
  }
}

function collectCva(call, out) {
  const [base, config] = call.arguments;
  if (base) collect(base, "keys", out);
  const cfg = unwrap(config);
  if (!cfg || cfg.type !== "ObjectExpression") return;
  for (const prop of cfg.properties) {
    if (prop.type !== "Property") continue;
    const name = keyName(prop);
    const value = unwrap(prop.value);
    if (name === "variants" && value?.type === "ObjectExpression") {
      for (const group of value.properties) {
        const options = group.type === "Property" ? unwrap(group.value) : null;
        if (options?.type !== "ObjectExpression") continue;
        for (const option of options.properties) {
          if (option.type === "Property") collect(option.value, "keys", out);
        }
      }
    } else if (name === "compoundVariants" && value?.type === "ArrayExpression") {
      for (const entry of value.elements) {
        const obj = unwrap(entry);
        if (obj?.type !== "ObjectExpression") continue;
        for (const p of obj.properties) {
          if (p.type === "Property" && (keyName(p) === "class" || keyName(p) === "className")) collect(p.value, "keys", out);
        }
      }
    }
  }
}

/** Return values of a function body (not of nested functions). */
function collectReturns(fn, out) {
  if (fn.body.type !== "BlockStatement") {
    collect(fn.body, "values", out);
    return;
  }
  const walk = (node) => {
    if (!node || typeof node.type !== "string") return;
    if (node.type === "ReturnStatement") {
      if (node.argument) collect(node.argument, "values", out);
      return;
    }
    if (node.type.includes("Function") || node.type === "ClassBody") return;
    for (const key of Object.keys(node)) {
      if (key === "parent" || key === "loc" || key === "range") continue;
      const child = node[key];
      if (Array.isArray(child)) child.forEach(walk);
      else if (child && typeof child.type === "string") walk(child);
    }
  };
  fn.body.body.forEach(walk);
}

function functionName(node, parent) {
  if (node.type === "FunctionDeclaration") return node.id?.name ?? null;
  if (parent?.type === "VariableDeclarator" && parent.id.type === "Identifier") return parent.id.name;
  return null;
}

const CONST_INIT_TYPES = new Set(["Literal", "TemplateLiteral", "ConditionalExpression", "LogicalExpression", "ArrayExpression"]);

function calleeName(callee) {
  callee = unwrap(callee);
  if (callee?.type === "Identifier") return callee.name;
  return null;
}

/**
 * Walks the whole program. Returns `{ groups, strings }`:
 * - `groups`: arrays of class-text nodes, one array per sink (one className / cn() / cva()).
 * - `strings`: every string-ish node in the file (for `hsl(var(--border` checks).
 */
export function findClassText(program, visitorKeys) {
  const groups = [];
  const strings = [];
  const seen = new Set();
  /** Identifiers used as class values inside a sink. */
  const refs = new Set();
  /** name -> const declarators with that name (any scope); `null` once a let/var shares it. */
  const consts = new Map();

  const addGroup = (nodes) => {
    const fresh = [];
    for (const n of nodes) {
      if (n.type === "Ref") {
        refs.add(n.name);
        continue;
      }
      const key = n.type === "IdentifierKey" ? n.node : n;
      if (seen.has(key)) continue;
      seen.add(key);
      fresh.push(n);
    }
    if (fresh.length) groups.push(fresh);
  };

  const visit = (node, parent, grandparent) => {
    if (!node || typeof node.type !== "string") return;

    if (node.type === "Literal" && typeof node.value === "string") strings.push(node);
    else if (node.type === "TemplateLiteral") strings.push(node);

    if (node.type === "VariableDeclaration") {
      for (const d of node.declarations) {
        if (d.id.type !== "Identifier") continue;
        const prev = consts.get(d.id.name);
        if (node.kind !== "const" || prev === null) consts.set(d.id.name, null);
        else consts.set(d.id.name, [...(prev ?? []), d]);
      }
      const topLevel = parent?.type === "Program" || (parent?.type === "ExportNamedDeclaration" && grandparent?.type === "Program");
      if (topLevel && node.kind === "const") {
        for (const d of node.declarations) {
          if (d.id.type === "Identifier" && SCREAMING_RE.test(d.id.name) && d.id.name.length > 1 && isClassConstant(d.init)) {
            const out = [];
            collect(d.init, "values", out);
            addGroup(out);
          }
        }
      }
    }

    if (node.type === "JSXAttribute" && node.name.type === "JSXIdentifier" && node.value) {
      const name = node.name.name;
      const isClass = ATTR_RE.test(name);
      const isMap = ATTR_MAP_RE.test(name);
      if (isClass || isMap) {
        const out = [];
        if (node.value.type === "Literal") out.push(node.value);
        else if (node.value.type === "JSXExpressionContainer") collect(node.value.expression, isMap ? "values" : "keys", out);
        addGroup(out);
      }
    } else if (node.type === "CallExpression") {
      const name = calleeName(node.callee);
      if (name && CLASS_FUNCS.has(name)) {
        const out = [];
        for (const arg of node.arguments) collect(arg.type === "SpreadElement" ? arg.argument : arg, "keys", out);
        addGroup(out);
      } else if (name === "cva") {
        const out = [];
        collectCva(node, out);
        addGroup(out);
      }
    } else if (node.type === "VariableDeclarator" && node.id.type === "Identifier" && node.init && NAME_RE.test(node.id.name)) {
      const out = [];
      collect(node.init, "values", out);
      addGroup(out);
    } else if (node.type === "AssignmentPattern" && node.left.type === "Identifier" && NAME_RE.test(node.left.name)) {
      const out = [];
      collect(node.right, "values", out);
      addGroup(out);
    } else if (
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression"
    ) {
      const name = functionName(node, parent);
      if (name && NAME_RE.test(name)) {
        const out = [];
        collectReturns(node, out);
        addGroup(out);
      }
    } else if (node.type === "Property" && parent?.type === "ObjectExpression") {
      const name = keyName(node);
      if (name && NAME_RE.test(name)) {
        const out = [];
        collect(node.value, "values", out);
        addGroup(out);
      }
    }

    const keys = visitorKeys[node.type] ?? [];
    for (const key of keys) {
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) visit(c, node, parent);
      } else if (child && typeof child.type === "string") {
        visit(child, node, parent);
      }
    }
  };

  visit(program, null, null);

  // Same-file constants used inside a sink: `const shell = "…"; cn(shell, …)`. Only plain
  // string-valued consts with one unambiguous declaration; resolving may surface more refs.
  const resolved = new Set();
  for (let changed = true; changed; ) {
    changed = false;
    for (const name of [...refs]) {
      if (resolved.has(name)) continue;
      resolved.add(name);
      const decls = consts.get(name);
      if (!decls || decls.length !== 1) continue;
      const init = unwrap(decls[0].init);
      if (!init || !CONST_INIT_TYPES.has(init.type)) continue;
      if (init.type === "Literal" && typeof init.value !== "string") continue;
      const out = [];
      collect(init, "values", out);
      addGroup(out);
      changed = true;
    }
  }
  return { groups, strings };
}

/**
 * Splits class-text nodes into whitespace-separated tokens with source offsets.
 * `fixable` is false when the source text differs from the value (escape sequences), so a
 * rewrite could not be mapped back. Tokens glued to a `${…}` boundary are partial and skipped.
 */
export function tokensOf(node, sourceText) {
  const tokens = [];
  const push = (text, start, fixable) => {
    for (const m of text.matchAll(/\S+/g)) {
      tokens.push({ text: m[0], start: start + m.index, end: start + m.index + m[0].length, fixable });
    }
  };

  if (node.type === "IdentifierKey") {
    // `{ rounded: on }` / `{ rounded }`: a rewrite must become a quoted key.
    const { name, range } = node.node;
    tokens.push({ text: name, start: range[0], end: range[1], fixable: true, identifierKey: { name, shorthand: Boolean(node.shorthand) } });
    return tokens;
  }
  if (node.type === "Literal") {
    const raw = sourceText.slice(node.range[0] + 1, node.range[1] - 1);
    const fixable = raw === node.value;
    if (fixable) push(raw, node.range[0] + 1, true);
    else for (const m of node.value.matchAll(/\S+/g)) tokens.push({ text: m[0], start: node.range[0], end: node.range[1], fixable: false });
    return tokens;
  }
  if (node.type === "TemplateLiteral") {
    const last = node.quasis.length - 1;
    node.quasis.forEach((quasi, i) => {
      const raw = quasi.value.raw;
      if (!raw) return;
      const start = quasi.range[0] + 1; // skip "`" or "}"
      const fixable = quasi.value.cooked === raw;
      for (const m of raw.matchAll(/\S+/g)) {
        const s = m.index;
        const e = s + m[0].length;
        if (i > 0 && s === 0) continue; // glued to the previous ${…}
        if (i < last && e === raw.length) continue; // glued to the next ${…}
        tokens.push({ text: m[0], start: start + s, end: start + e, fixable });
      }
    });
    return tokens;
  }
  return tokens;
}
