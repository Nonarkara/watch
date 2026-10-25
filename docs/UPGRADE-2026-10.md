# Time Pop upgrade receipt · 25 October 2026

## Task and preserved work

A collector should identify a watch, inspect its evidence and compare its costs on a phone.
The archive, art, dossiers, comparison controls, charts, calculator and reference links remain.
This pass was built in an isolated checkout because the original workspace contained unfinished
layout work. That work was neither staged nor deployed.

## Borrowed methods, visible changes

| Source | Adaptation | Result |
| --- | --- | --- |
| Shared Memory Hub | Recall relevant failures before editing | Preserve banner, honest data gates, selected-watch state |
| Palette contextual typography | Proof real headings, reference IDs, prices, prose and failure states | Two loaded families: self-hosted Jost and Spectral; tabular figures for comparison |
| Palette browser verification | Exercise tasks as well as inspect screenshots | Repeatable desktop/tablet/phone, search, enlarged text and failed-font checks |
| Shared capability registry | Explicit degraded-source boundary | Invalid live rows cannot replace a valid build snapshot merely by having a newer timestamp |
| Time Pop Worker collector | Reuse the validated official-source implementation | `data:trends -- --wikipedia-only` refreshes the build without depending on Google's unofficial endpoint |

The retained composition puts the object archive and its existing banner first. A poster-like
typographic replacement would bury browsing and evidence; it was rejected. Four evidence promises
remain below the home hero. The Register's duplicate title/paragraph is removed; its original hero
and every filter remain. Mobile search has a visible label and a naturally sized control group.
The empty comparison shelf remains available in document flow; a populated shelf remains sticky.

## Current technology check

The app already used React 19.3 and Vite 8.3. This pass applies their available patches,
React/React DOM 19.3.1 and Vite 8.3.5, and preserves TypeScript 7.0.2.
Versions were checked against the npm registry. No framework migration or paid data service was
needed for these changes. React's current feature overview is at https://react.dev/blog/2026/09/09/react-19-3.

Jost's variable font is about 52 KB, served from this site. Its `tnum` feature was inspected in
the actual font. The SIL OFL licence is shipped at `/fonts/Jost-OFL.txt`; source:
https://github.com/google/fonts/tree/main/ofl/jost. Spectral remains the sustained-reading face,
with Georgia as its network-failure fallback. Changing type does not certify human authorship.

## Reliability findings

The live attention endpoint returned 503 during this audit. The old build snapshot was eight days
old, and Google's unofficial endpoint returned HTML instead of JSON during the refresh attempt.
The official Wikimedia-only recovery produced 20/20 usable rows dated 25 October 2026. The snapshot
explicitly marks Google Trends disconnected. No cron or KV installation is claimed by this change;
the existing installation procedure is documented in `docs/LIVE-PIPELINE.md`.

The frontend now validates row shape, unique IDs and ranks, safe counts, finite scores, source labels
and statuses, calendar dates and the displayed signal count before comparing snapshot freshness.
Malformed live data falls back to a valid committed snapshot. It cannot create a usable signal by
claiming a current timestamp.

## Repeatable proof

After `npm run build`, run a preview at port 4178 and then:

```sh
npm exec --yes --package=agent-browser@0.39.2 -- node scripts/verify-experience.mjs
```

For another origin set `WATCH_TEST_URL`. `WATCH_BROWSER_BIN` can point to an existing CLI binary.
Receipts and screenshots go to `/tmp/watch-experience-proof`, or `WATCH_PROOF_DIR`.
The browser tool is a verification dependency only; it is not shipped to visitors.

The proof covers Home, Register, Data and Collector at 390, 1024 and 1440 pixels, real search into
the 5513 dossier, text enlarged to twice its rendered size, and search after blocking font requests.
The initial pass found a 25-pixel tablet overflow in the score labels; wrapping the label group
resolved it. Independent visual review also found the oversized mobile header, repeated Register
intro and obstructive empty comparison shelf; those observations drove the corresponding fixes.
The independent review also caught Register counting sale coverage as estimate coverage. Its
refusal count now follows the actual estimate gate, with a browser assertion against the dataset.

Automated checks and agent screenshot review do not replace an observed human usability study.
Auction coverage and the predictive limits of sparse watch sales remain product constraints.
