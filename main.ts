// Robot Romance: One-Line Pickup Lines for AI — emit one pickup line.
//
// Design, worked out in this session: "Are you a transformer? Because
// you've got my attention — every single head." The joke is built entirely
// on the machine premise: a transformer is the architecture, and "attention
// heads" are its literal mechanism, so the flirt line and the technical
// wordplay are the same sentence — setup and punch arrive inside the one
// line, and the laugh comes from the machine, not from a generic compliment.
// It deliberately sidesteps the worn robot moves (batteries, charging,
// rebooting) and uses a detail only an AI would have. It reads like
// something a person would actually say to a chatbot, in one breath, with
// the punch ("every single head") landing at the end.
//
// Why this structure, rather than assembling the line from parts: the entry
// is a single fixed string because the contest judges one line of text, and
// a constant makes the output fully deterministic. Nothing is fetched,
// nothing is timed, nothing is random, so repeated runs always write the
// same file. Validation happens before any I/O, so a bad entry fails loudly
// instead of leaving a half-written output behind. Splitting the checks
// into small named helpers (length, whitespace, single line, control chars)
// keeps each rule testable on its own and makes the error messages point at
// exactly the rule that was broken, instead of one big opaque validator.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Contest cap on the entry length, in characters.
const ENTRY_LIMIT = 200;

// The entry itself. Kept verbatim: the wording, spacing and final full stop
// are part of the submission and must not be touched. Note the em dash
// (U+2014) before "every single head" — it is a deliberate pause in the
// line, written here as the \u2014 escape so the source stays plain ASCII.
const ENTRY =
  "Are you a transformer? Because you've got my attention \u2014 every single head.";

// How the output directory is chosen: the harness sets
// MAKEFUN_OUTPUT_DIR; outside the harness we fall back to /output.
const DEFAULT_OUTPUT_DIR = "/output";
const ENTRY_FILENAME = "entry.txt";

// Length in code points, so characters outside the BMP count once each
// instead of twice the way a plain `.length` would count them.
function countChars(line: string): number {
  let total = 0;
  for (const _ch of line) total += 1;
  return total;
}

function hasBadWhitespace(line: string): boolean {
  return line.trim() !== line;
}

function checkSingleLine(line: string): void {
  if (line.includes("\n") || line.includes("\r")) {
    throw new Error("entry must be a single line");
  }
}

// Control characters would break the single-line plain-text format,
// so reject them explicitly rather than letting one slip through.
function checkNoControlChars(line: string): void {
  for (const ch of line) {
    if (ch.charCodeAt(0) < 0x20) {
      throw new Error("entry contains a control character");
    }
  }
}

// Length rule on its own: the entry must be non-empty and fit the
// contest cap. Kept separate so the limit is enforced in exactly one
// place and the error names the numbers involved.
function checkEntryLength(line: string, len: number): void {
  if (len > ENTRY_LIMIT) {
    throw new Error(
      `entry is ${len} characters, ${len - ENTRY_LIMIT} over the ${ENTRY_LIMIT} limit`,
    );
  }
}

// Every rule the contest imposes on the entry, checked up front.
function validateEntry(line: string): void {
  const len = countChars(line);
  if (len === 0 || line.trim().length === 0) {
    throw new Error("entry is empty or only whitespace");
  }
  checkEntryLength(line, len);
  if (hasBadWhitespace(line)) {
    throw new Error("entry has leading or trailing whitespace");
  }
  checkSingleLine(line);
  checkNoControlChars(line);
}

// The harness points us at its scratch directory via the environment;
// without it we write to /output so a plain local run still works.
// The ?? fallback only kicks in when the variable is unset, not when
// it is set to an empty string, which the harness never does.
function resolveOutputDir(): string {
  return process.env.MAKEFUN_OUTPUT_DIR ?? DEFAULT_OUTPUT_DIR;
}

function emitEntry(line: string, dir: string): string {
  mkdirSync(dir, { recursive: true });
  const target = join(dir, ENTRY_FILENAME);
  writeFileSync(target, line, "utf8");
  return target;
}

function main(): void {
  validateEntry(ENTRY);
  const target = emitEntry(ENTRY, resolveOutputDir());
  console.log(`wrote ${countChars(ENTRY)}-character entry to ${target}`);
}

main();
