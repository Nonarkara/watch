/**
 * The release chain's spatial gate: the gate, then the proof that it bites.
 *
 * Two runs, in this order:
 *
 *   1. THE GATE. Every route, every layout-changing width, in a real browser,
 *      against the recorded receipt. It must pass. If it does not, the page
 *      has changed shape and the change has not been written down.
 *
 *   2. THE FALSIFIER. The same gate, run against a page that has been
 *      deliberately broken in each of the ways it is supposed to catch. A gate
 *      that has never been shown to fail is a report, not a gate. Every
 *      fixture must bite; if one does not, the gate is not trustworthy and
 *      this fails.
 *
 * There are no exceptions here. An earlier version of this file allowed one
 * fixture - the page with no <main> - on the grounds that the instrument
 * could not measure it. It could: the measurement copy was reaching its load
 * event after the gate had already measured, so the fixture never landed in
 * the page the gate read. scripts/spatial/prerender.mjs now fires the load
 * event when the document is parsed, and all seventeen fixtures bite.
 *
 *   node scripts/spatial/verify.mjs
 */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');

function run(script, args) {
  return new Promise((resolve) => {
    // The child's words go to the console as they happen. A gate that
    // prints nothing for forty minutes is a gate nobody trusts, and the
    // person running it cannot tell a slow sweep from a hung one.
    const child = spawn(process.execPath, [join(HERE, script), ...args], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });
    let out = '';
    const relay = (d) => { out += d.toString(); process.stdout.write(d); };
    child.stdout.on('data', relay);
    child.stderr.on('data', relay);
    child.on('close', (code) => resolve({ code, out }));
  });
}

console.log('── the gate ──');
const gate = await run('spatial-check.mjs', ['--dir', '.spatial-dist', '--baseline', 'design/spatial-baseline.json']);
if (gate.code !== 0) {
  console.error('\nFAIL — the gate did not pass. The page has changed shape and the change has not been written down.');
  process.exit(1);
}

console.log('\n── the falsifier: does the gate bite? ──');
const falsify = await run('spatial-falsify.mjs', ['.spatial-dist']);
const out = falsify.out;

const caught = (out.match(/^\s*· caught:/gm) || []).length;
const failedLines = out.split('\n').filter((l) => /^\s*✗/.test(l));

if (failedLines.length === 0 && caught > 0) {
  console.log(`\n✓ the gate bites: ${caught} injected defects, all caught.`);
  process.exit(0);
}

console.error(
  `\nFAIL — ${failedLines.length} fixture(s) did not bite. The gate is not trustworthy.\n` +
    failedLines.map((l) => `  ${l.trim()}`).join('\n'),
);
process.exit(1);
