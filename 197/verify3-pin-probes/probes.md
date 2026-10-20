# Pin probes (round 2) against scripts/pr-capture/pin.ts @ 5d70dd1

Each case drives the real createSessionPin socket with client/server frames, then calls report() and pinFlagged(report, pin, runSaved).

## Harness

```ts
import { createSessionPin, pinFlagged, appearanceKey } from "../../scripts/pr-capture/pin.ts";

const PIN = { theme: "aurora", mode: "light", chrome: "calm" } as const;
const SAVED = { _id: "s1", userId: "u1", theme: "dark", chrome: "expressive", colorSource: { kind: "preset", preset: "cyberpunk" } };
const RUN_SAVED = "cyberpunk/dark/expressive";
const EQ = { theme: "cyberpunk", mode: "dark", chrome: "expressive" } as const;
const sub = (id = 3) => ({ type: "ModifyQuerySet", modifications: [{ type: "Add", queryId: id, udfPath: "sessions:getSession" }] });
const upd = (value: unknown, id = 3, type = "QueryUpdated") =>
  JSON.stringify({ type: "Transition", modifications: [{ type, queryId: id, value }] });
type P = ReturnType<typeof createSessionPin>;
type Case = { name: string; pin?: any; run: (p: P) => void; runSaved?: string | null };
const cases: Case[] = [
  { name: "M1a no result before shot", run: (p) => p.socket().fromClient(sub()) },
  { name: "M1b QueryResult instead of QueryUpdated", run: (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd(SAVED, 3, "QueryResult")); } },
  { name: "M1c unknown frame type", run: (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(JSON.stringify({ type: "TransitionV2", modifications: [{ type: "QueryUpdated", queryId: 3, value: SAVED }] })); } },
  { name: "M1d modifications key renamed", run: (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(JSON.stringify({ type: "Transition", changes: [{ type: "QueryUpdated", queryId: 3, value: SAVED }] })); } },
  { name: "M1a + runSaved (other shots read saved)", runSaved: RUN_SAVED, run: (p) => p.socket().fromClient(sub()) },
  { name: "S1 partial shape (only theme kept)", run: (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd({ _id: "s1", theme: "dark", prefs: { chrome: "expressive", colorSource: SAVED.colorSource } })); } },
  { name: "S1 partial shape (theme+chrome kept)", run: (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd({ _id: "s1", theme: "dark", chrome: "expressive" })); } },
  { name: "S1 custom colorSource", run: (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd({ ...SAVED, colorSource: { kind: "custom", custom: { fallback: {} } } })); } },
  { name: "S1 empty chrome", run: (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd({ ...SAVED, chrome: "" })); } },
  { name: "S1 preset empty string", run: (p) => { const s = p.socket(); s.fromClient(sub()); s.fromServer(upd({ ...SAVED, colorSource: { kind: "preset", preset: "" } })); } },
  { name: "X1 reconnect: s1 patched, s2 resubscribes, no result", run: (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); p.socket().fromClient(sub(0)); } },
  { name: "X2 reconnect: s1 patched, s2 result in new frame type", run: (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); const b = p.socket(); b.fromClient(sub(0)); b.fromServer(JSON.stringify({ type: "TransitionV2", modifications: [{ type: "QueryUpdated", queryId: 0, value: SAVED }] })); } },
  { name: "X2b reconnect: s2 result normal", run: (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); const b = p.socket(); b.fromClient(sub(0)); const out = b.fromServer(upd(SAVED, 0)); console.log("    X2b forwarded theme:", JSON.parse(out[0]).modifications[0].value.theme); } },
  { name: "X3 two subs same socket, one patched, other no result", run: (p) => { const a = p.socket(); a.fromClient(sub(3)); a.fromClient(sub(4)); a.fromServer(upd(SAVED, 3)); } },
  { name: "X4 two subs, one patched, other QueryResult type", run: (p) => { const a = p.socket(); a.fromClient(sub(3)); a.fromClient(sub(4)); a.fromServer(upd(SAVED, 3)); a.fromServer(upd(SAVED, 4, "QueryResult")); } },
  { name: "X5 patched, later update uses renamed type", run: (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); a.fromServer(upd(SAVED, 3, "QueryResult")); } },
  { name: "X6 patched then null", run: (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(SAVED)); a.fromServer(upd(null)); } },
  { name: "X7 sessions.js:getSession path", run: (p) => { const a = p.socket(); a.fromClient({ type: "ModifyQuerySet", modifications: [{ type: "Add", queryId: 3, udfPath: "sessions.js:getSession" }] }); a.fromServer(upd(SAVED)); } },
  { name: "X8 batched Add + chunk interleaved with Ping", run: (p) => { const a = p.socket(); a.fromClient({ type: "ModifyQuerySet", modifications: [{ type: "Add", queryId: 1, udfPath: "decks:list" }, { type: "Add", queryId: 3, udfPath: "sessions:getSession" }] }); const whole = upd(SAVED); const h = whole.length >> 1; a.fromServer(JSON.stringify({ type: "TransitionChunk", chunk: whole.slice(0, h), partNumber: 0, totalParts: 2 })); a.fromServer(JSON.stringify({ type: "Ping" })); const out = a.fromServer(JSON.stringify({ type: "TransitionChunk", chunk: whole.slice(h), partNumber: 1, totalParts: 2 })); console.log("    X8 forwarded theme:", JSON.parse(out[0]).modifications[0].value.theme); } },
  { name: "X9 value array", run: (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd([1, 2])); } },
  { name: "X10 value string", run: (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd("x")); } },
  { name: "X11 Add frame arrives as non-ModifyQuerySet (e.g. renamed client frame)", run: (p) => { const a = p.socket(); a.fromClient({ type: "ModifyQuerySetV2", modifications: [{ type: "Add", queryId: 3, udfPath: "sessions:getSession" }] } as any); a.fromServer(upd(SAVED)); } },
  { name: "E1 pin==saved, no result (unpatched JS = app defaults)", pin: EQ, runSaved: RUN_SAVED, run: (p) => p.socket().fromClient(sub()) },
  { name: "E2 pin==saved, result null", pin: EQ, runSaved: RUN_SAVED, run: (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(upd(null)); } },
  { name: "E3 pin==saved, never subscribed", pin: EQ, runSaved: RUN_SAVED, run: (p) => { p.socket(); } },
  { name: "E4 pin==saved, QueryFailed", pin: EQ, runSaved: RUN_SAVED, run: (p) => { const a = p.socket(); a.fromClient(sub()); a.fromServer(JSON.stringify({ type: "Transition", modifications: [{ type: "QueryFailed", queryId: 3, errorMessage: "boom" }] })); } },
];
for (const c of cases) {
  const ap = c.pin ?? PIN;
  const p = createSessionPin(ap);
  c.run(p);
  const r = p.report();
  const f = pinFlagged(r, ap, c.runSaved ?? null);
  console.log(`${c.name}\n    patched=${r.patched} saved=${r.saved} problems=${JSON.stringify(r.problems)} pin=${appearanceKey(ap)} runSaved=${c.runSaved ?? null} FLAGGED=${f}`);
}

```

## Output

```
M1a no result before shot
    patched=false saved=null problems=["subscribed to sessions:getSession but no result was rewritten (none arrived, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
M1b QueryResult instead of QueryUpdated
    patched=false saved=null problems=["subscribed to sessions:getSession but no result was rewritten (none arrived, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
M1c unknown frame type
    patched=false saved=null problems=["subscribed to sessions:getSession but no result was rewritten (none arrived, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
M1d modifications key renamed
    patched=false saved=null problems=["subscribed to sessions:getSession but no result was rewritten (none arrived, or the sync protocol changed)"] pin=aurora/light/calm runSaved=null FLAGGED=true
M1a + runSaved (other shots read saved)
    patched=false saved=null problems=["subscribed to sessions:getSession but no result was rewritten (none arrived, or the sync protocol changed)"] pin=aurora/light/calm runSaved=cyberpunk/dark/expressive FLAGGED=true
S1 partial shape (only theme kept)
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid chrome/colorSource (shape changed?)"] pin=aurora/light/calm runSaved=null FLAGGED=true
S1 partial shape (theme+chrome kept)
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid colorSource (shape changed?)"] pin=aurora/light/calm runSaved=null FLAGGED=true
S1 custom colorSource
    patched=true saved=custom/dark/expressive problems=[] pin=aurora/light/calm runSaved=null FLAGGED=false
S1 empty chrome
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid chrome (shape changed?)"] pin=aurora/light/calm runSaved=null FLAGGED=true
S1 preset empty string
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid colorSource (shape changed?)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X1 reconnect: s1 patched, s2 resubscribes, no result
    patched=true saved=cyberpunk/dark/expressive problems=[] pin=aurora/light/calm runSaved=null FLAGGED=false
X2 reconnect: s1 patched, s2 result in new frame type
    patched=true saved=cyberpunk/dark/expressive problems=[] pin=aurora/light/calm runSaved=null FLAGGED=false
    X2b forwarded theme: light
X2b reconnect: s2 result normal
    patched=true saved=cyberpunk/dark/expressive problems=[] pin=aurora/light/calm runSaved=null FLAGGED=false
X3 two subs same socket, one patched, other no result
    patched=true saved=cyberpunk/dark/expressive problems=[] pin=aurora/light/calm runSaved=null FLAGGED=false
X4 two subs, one patched, other QueryResult type
    patched=true saved=cyberpunk/dark/expressive problems=[] pin=aurora/light/calm runSaved=null FLAGGED=false
X5 patched, later update uses renamed type
    patched=true saved=cyberpunk/dark/expressive problems=[] pin=aurora/light/calm runSaved=null FLAGGED=false
X6 patched then null
    patched=true saved=cyberpunk/dark/expressive problems=["sessions:getSession returned null, so there was nothing to rewrite"] pin=aurora/light/calm runSaved=null FLAGGED=true
X7 sessions.js:getSession path
    patched=true saved=cyberpunk/dark/expressive problems=[] pin=aurora/light/calm runSaved=null FLAGGED=false
    X8 forwarded theme: light
X8 batched Add + chunk interleaved with Ping
    patched=true saved=cyberpunk/dark/expressive problems=[] pin=aurora/light/calm runSaved=null FLAGGED=false
X9 value array
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid theme/chrome/colorSource (shape changed?)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X10 value string
    patched=false saved=null problems=["sessions:getSession result is missing or has invalid theme/chrome/colorSource (shape changed?)"] pin=aurora/light/calm runSaved=null FLAGGED=true
X11 Add frame arrives as non-ModifyQuerySet (e.g. renamed client frame)
    patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] pin=aurora/light/calm runSaved=null FLAGGED=true
E1 pin==saved, no result (unpatched JS = app defaults)
    patched=false saved=null problems=["subscribed to sessions:getSession but no result was rewritten (none arrived, or the sync protocol changed)"] pin=cyberpunk/dark/expressive runSaved=cyberpunk/dark/expressive FLAGGED=false
E2 pin==saved, result null
    patched=false saved=null problems=["sessions:getSession returned null, so there was nothing to rewrite"] pin=cyberpunk/dark/expressive runSaved=cyberpunk/dark/expressive FLAGGED=false
E3 pin==saved, never subscribed
    patched=false saved=null problems=["no sessions:getSession subscription was seen (renamed, or the page isn't signed in)"] pin=cyberpunk/dark/expressive runSaved=cyberpunk/dark/expressive FLAGGED=false
E4 pin==saved, QueryFailed
    patched=false saved=null problems=["sessions:getSession failed: boom"] pin=cyberpunk/dark/expressive runSaved=cyberpunk/dark/expressive FLAGGED=false

```
