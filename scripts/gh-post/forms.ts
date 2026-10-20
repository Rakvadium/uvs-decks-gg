/**
 * The `gh` command lines gh-post knows how to scan, and a parser for them. Anything else is
 * refused: an unknown subcommand or flag could carry text this parser can't see.
 */

/**
 * - `value`: takes a value, which is scanned with the rest of the command line.
 * - `file`: a path, or `-` for stdin, whose contents gh posts (`--body-file`, `--input`).
 * - `field`: `gh api -F key=value`; `key=@path` and `key=@-` read the value from a file or stdin.
 * - `bool`: takes no value.
 * - `refuse`: gh would get its text from somewhere gh-post can't read first.
 */
export type Kind = "value" | "file" | "field" | "bool" | "refuse";
export type Flag = { long: string; short?: string; kind: Kind; why?: string };

/** Each flag as given, `value` included (none for `bool`). */
export type Parsed = { command: string; flags: { flag: Flag; value?: string }[]; positionals: string[] };

type Command = { flags: Flag[]; check: (parsed: Parsed) => string | undefined };

const flag = (long: string, short: string | undefined, kind: Kind, why?: string): Flag => ({ long, short, kind, why });

const EDITOR = "opens an editor, so the text never passes through gh-post. Use --body or --body-file";
const WEB = "opens a browser to write the text, which gh-post can't scan. Use --body or --body-file";
const TEMPLATE = "takes the body from a template gh fetches itself. Put the text in a file and pass --body-file";
const RECOVER = "reads the title and body from a saved run. Pass them with --title and --body-file";

const REPO = flag("repo", "R", "value");
const TITLE = flag("title", "t", "value");
const BODY = flag("body", "b", "value");
const BODY_FILE = flag("body-file", "F", "file");
const EDITOR_FLAG = flag("editor", "e", "refuse", EDITOR);
const WEB_FLAG = flag("web", "w", "refuse", WEB);
const MILESTONE = flag("milestone", "m", "value");

const EDIT_FLAGS = [
  REPO,
  TITLE,
  BODY,
  BODY_FILE,
  MILESTONE,
  ...["add-assignee", "remove-assignee", "add-label", "remove-label", "add-project", "remove-project"].map((name) =>
    flag(name, undefined, "value"),
  ),
  flag("remove-milestone", undefined, "bool"),
];

const COMMENT_FLAGS = [
  REPO,
  BODY,
  BODY_FILE,
  EDITOR_FLAG,
  WEB_FLAG,
  flag("edit-last", undefined, "bool"),
  flag("create-if-none", undefined, "bool"),
  flag("delete-last", undefined, "bool"),
  flag("yes", undefined, "bool"),
];

export const has = (parsed: Parsed, long: string) => parsed.flags.some((f) => f.flag.long === long);
const hasBody = (parsed: Parsed) => has(parsed, "body") || has(parsed, "body-file");
export const FILL = ["fill", "fill-first", "fill-verbose"];

const PROMPT = "gh would prompt for the text, which gh-post can't scan";

const COMMANDS: Record<string, Command> = {
  "pr create": {
    flags: [
      REPO,
      TITLE,
      BODY,
      BODY_FILE,
      MILESTONE,
      flag("assignee", "a", "value"),
      flag("base", "B", "value"),
      flag("head", "H", "value"),
      flag("label", "l", "value"),
      flag("project", "p", "value"),
      flag("reviewer", "r", "value"),
      flag("draft", "d", "bool"),
      flag("dry-run", undefined, "bool"),
      flag("no-maintainer-edit", undefined, "bool"),
      flag("fill", "f", "bool"),
      flag("fill-first", undefined, "bool"),
      flag("fill-verbose", undefined, "bool"),
      EDITOR_FLAG,
      WEB_FLAG,
      flag("template", "T", "refuse", TEMPLATE),
      flag("recover", undefined, "refuse", RECOVER),
    ],
    check(parsed) {
      if (parsed.positionals.length) return "pr create takes no positional arguments";
      if (FILL.some((name) => has(parsed, name))) {
        // gh takes the commits between the base branch and the head; gh-post scans them, so it needs both.
        if (!has(parsed, "base")) return "--fill, --fill-first and --fill-verbose need --base, so gh-post can find the commits gh will use";
        if (has(parsed, "head")) return "--fill, --fill-first and --fill-verbose can't be combined with --head; check out the head branch instead";
        return;
      }
      if (!has(parsed, "title") || !hasBody(parsed)) return `pass --title and --body or --body-file (or --fill with --base): otherwise ${PROMPT}`;
    },
  },
  "pr edit": {
    flags: [...EDIT_FLAGS, flag("base", "B", "value"), flag("add-reviewer", undefined, "value"), flag("remove-reviewer", undefined, "value")],
    check(parsed) {
      if (parsed.positionals.length > 1) return "pr edit takes at most one PR";
      if (!parsed.flags.some((f) => f.flag !== REPO)) return `pass at least one edit flag: otherwise ${PROMPT}`;
    },
  },
  "pr comment": { flags: COMMENT_FLAGS, check: (parsed) => checkComment(parsed, "pr comment") },
  "issue create": {
    flags: [
      REPO,
      TITLE,
      BODY,
      BODY_FILE,
      MILESTONE,
      flag("assignee", "a", "value"),
      flag("label", "l", "value"),
      flag("project", "p", "value"),
      EDITOR_FLAG,
      WEB_FLAG,
      flag("template", "T", "refuse", TEMPLATE),
      flag("recover", undefined, "refuse", RECOVER),
    ],
    check(parsed) {
      if (parsed.positionals.length) return "issue create takes no positional arguments";
      if (!has(parsed, "title") || !hasBody(parsed)) return `pass --title and --body or --body-file: otherwise ${PROMPT}`;
    },
  },
  "issue comment": { flags: COMMENT_FLAGS, check: (parsed) => checkComment(parsed, "issue comment") },
  "issue edit": {
    flags: EDIT_FLAGS,
    check(parsed) {
      if (!parsed.positionals.length) return "issue edit needs an issue number";
      if (!parsed.flags.some((f) => f.flag !== REPO)) return `pass at least one edit flag: otherwise ${PROMPT}`;
    },
  },
  api: {
    flags: [
      flag("method", "X", "value"),
      flag("field", "F", "field"),
      flag("raw-field", "f", "value"),
      flag("header", "H", "value"),
      flag("input", undefined, "file"),
      flag("hostname", undefined, "value"),
      flag("preview", "p", "value"),
      flag("jq", "q", "value"),
      flag("template", "t", "value"),
      flag("cache", undefined, "value"),
      flag("include", "i", "bool"),
      flag("paginate", undefined, "bool"),
      flag("slurp", undefined, "bool"),
      flag("silent", undefined, "bool"),
      flag("verbose", undefined, "bool"),
    ],
    check(parsed) {
      if (parsed.positionals.length !== 1) return "api takes exactly one endpoint";
    },
  },
};

export const SUPPORTED = Object.keys(COMMANDS);

function checkComment(parsed: Parsed, name: string): string | undefined {
  if (parsed.positionals.length > 1) return `${name} takes at most one ${name.startsWith("pr") ? "PR" : "issue"}`;
  if (name === "issue comment" && !parsed.positionals.length) return "issue comment needs an issue number";
  if (has(parsed, "delete-last")) return hasBody(parsed) ? "--delete-last takes no body" : undefined;
  if (!hasBody(parsed)) return `pass --body or --body-file: otherwise ${PROMPT}`;
}

/**
 * Parses `gh` args the way gh's flag parser (pflag) does, minus the forms that are easy to misread:
 * short flags must stand alone (`-b value`, not `-bvalue`, `-b=value` or `-db`), and `bool` flags
 * take no `=value`. A value flag takes the next arg even if it starts with `-`, as pflag does.
 * Returns a refusal message instead when the command line isn't one gh-post can scan.
 */
export function parseGh(args: string[]): Parsed | string {
  const supported = `Supported: ${SUPPORTED.map((name) => `gh ${name}`).join(", ")}.`;
  const command = args[0] === "api" ? "api" : `${args[0] ?? ""} ${args[1] ?? ""}`;
  const spec = COMMANDS[command];
  if (!spec) return `can't scan this gh command. ${supported}`;
  const parsed: Parsed = { command, flags: [], positionals: [] };
  const rest = args.slice(command === "api" ? 1 : 2);
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--") {
      parsed.positionals.push(...rest.slice(i + 1));
      break;
    }
    if (!arg.startsWith("-") || arg === "-") {
      parsed.positionals.push(arg);
      continue;
    }
    let found: Flag | undefined;
    let inline: string | undefined;
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      const name = eq === -1 ? arg.slice(2) : arg.slice(2, eq);
      inline = eq === -1 ? undefined : arg.slice(eq + 1);
      found = spec.flags.find((f) => f.long === name);
      if (!found) return `gh ${command}: unknown flag ${eq === -1 ? arg : arg.slice(0, eq)}. gh-post accepts only the flags it knows how to scan.`;
    } else {
      found = arg.length === 2 ? spec.flags.find((f) => f.short === arg[1]) : undefined;
      if (!found) {
        return `gh ${command}: can't parse ${arg.length === 2 ? "unknown flag " + arg : "a combined or attached short flag"}. Write each short flag on its own, with its value as the next argument.`;
      }
    }
    const label = `--${found.long}`;
    if (found.kind === "refuse") return `gh ${command} ${label} ${found.why}.`;
    if (found.kind === "bool") {
      if (inline !== undefined) return `gh ${command}: ${label} takes no value`;
      parsed.flags.push({ flag: found });
      continue;
    }
    let value = inline;
    if (value === undefined) {
      if (i + 1 >= rest.length) return `gh ${command}: ${label} needs a value`;
      value = rest[++i];
    }
    parsed.flags.push({ flag: found, value });
  }
  return spec.check(parsed) ?? parsed;
}

/** Where a `file` or `field` flag reads text from: a path, `-` for stdin, or nowhere (a plain field). */
export function textSource(entry: { flag: Flag; value?: string }): string | undefined {
  if (entry.flag.kind === "file") return entry.value;
  if (entry.flag.kind !== "field" || entry.value === undefined) return;
  const eq = entry.value.indexOf("=");
  if (eq !== -1 && entry.value[eq + 1] === "@") return entry.value.slice(eq + 2) || undefined;
}

/** `entry` with its file (see `textSource`) swapped for `file`, as one `--long=value` arg. */
export function withSource(entry: { flag: Flag; value?: string }, file: string): string {
  if (entry.flag.kind === "file") return `--${entry.flag.long}=${file}`;
  const value = entry.value ?? "";
  return `--${entry.flag.long}=${value.slice(0, value.indexOf("=") + 2)}${file}`;
}

/** The parsed command as gh args: `--long=value` for every flag, positionals after `--` if any starts with `-`. */
export function toArgs(parsed: Parsed, replace: (index: number) => string | undefined = () => undefined): string[] {
  const out = parsed.command.split(" ");
  parsed.flags.forEach((entry, index) => {
    out.push(replace(index) ?? (entry.value === undefined ? `--${entry.flag.long}` : `--${entry.flag.long}=${entry.value}`));
  });
  if (parsed.positionals.some((arg) => arg.startsWith("-"))) out.push("--");
  out.push(...parsed.positionals);
  return out;
}
