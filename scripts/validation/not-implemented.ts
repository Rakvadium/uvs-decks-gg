export {};

/** Placeholder for validation/agent scripts that later issues build (see issue #207's split). */
const name = process.argv[2] ?? "this command";
console.error(`${name}: not implemented yet (see issue #207 and its follow-up issues).`);
process.exitCode = 1;
