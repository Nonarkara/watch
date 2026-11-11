#!/usr/bin/env python3
"""Write the reasons for the spatial decisions the gate found, and report the
ones that have none.

A reason is not an apology. It names a DESIGN DECISION and a MEASURED FACT,
so that the next person can check it: if the geometry changes, the reason
stops being true and the decision has to be made again.

    python3 scripts/spatial/write-reasons.py /tmp/sweep-mg.json

Writes into design/spatial-baseline.json. Prints every distinct decision
that has no reason yet, so nothing is quietly forgiven.
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASELINE = os.path.join(ROOT, "design", "spatial-baseline.json")

# key = "kind|selector". Each reason names the decision and the measured fact.
REASONS = {
    "dead|div.spotlight-ctas.mono": (
        "The spotlight is a reading block in two columns: the story, and the "
        "actions. The actions sit at the TOP of their column, level with the "
        "opening of the story beside them, because that is where the reader's "
        "eye already is when the paragraph starts. Measured at 878px the two "
        "CTAs are 30px tall in a 108px band and the 78px below them is the "
        "story's column, which runs on for more lines underneath. Moving the "
        "actions to the foot of their column would move the hole above them "
        "instead of removing it; the space belongs to the story."
    ),
    "dead|aside.data-methodology-rail": (
        "The methodology rail is a sticky rail beside the audit ledger, not a card: "
        "`align-self: start` and `position: sticky; top: 24px` from 880px, so it "
        "stays beside the reader while the long evidence table scrolls under it. "
        "Measured at 880px the rail's own box is 928px tall inside a 3121px row, "
        "and the column beside it is 2193px taller. The space below the rail is "
        "the audit's length, not a hole in the rail."
    ),
    "dead|aside.pom-bio-aside": (
        "Uncle Pom's bio is a bordered aside in a two-column dossier layout "
        "(`align-self: start`), so it is the height of its own content and the "
        "essay beside it is the taller column. Measured at 880px the aside is "
        "240px tall in a 511px row, and the 271px under it is the essay's "
        "column, which continues past the aside by exactly that much."
    ),
    "dead|div.market-toggle": (
        "The market toggle is baseline-aligned with a section heading that wraps "
        "to three lines at this width (`align-items: baseline`). Measured at "
        "481px the heading is 100.8px tall and the toggle 22px, so the 79px "
        "under the toggle is the heading's own last line. The toggle belongs to "
        "the first line, where the reader's eye already is."
    ),
    "dead|div.vc-specs": (
        "The venue card's specification rows (venue role, fee evidence) sit "
        "under the card header, and the card's height is set by the header's "
        "wrapped address beside it. Measured at 759px the 75.5px below the "
        "spec block is the card's own air above the visit link, and the card's "
        "border is the ledger's rule, not a frame drawn around a hole."
    ),
    "dead|p": (
        "The screen card's description paragraph is followed by the status note "
        "and the action row, both pinned to the card's foot by `margin-top: "
        "auto`, so the rows stay equal height and the ledger's rules stay "
        "straight across all three columns. Measured at 919px the paragraph "
        "ends 216px above the action row. That gap is the slack between this "
        "card's text and the longest description in its row."
    ),
    "dead|p.guide-card-subtitle": (
        "The guide card's reading time and its call to action are pinned to the "
        "card's foot (`margin-top: auto` on `.guide-card-mins`), and the three "
        "guide cards are one ruled row of three - coral, yellow, navy - so "
        "their heights are equal and the row's black rules stay straight. "
        "Measured at 1099px the subtitle ends 138.1px above the pinned reading "
        "time; that gap is the card's air, and it is the same in all three "
        "cards, which is what makes the row read as one composition."
    ),
    "dead|p.screen-rights.mono": (
        "The screen card's rights line is followed by the status note and the "
        "action row, which are pinned to the card's foot so the ledger's rows "
        "stay equal height. Measured at 1099px the rights line ends 78.4px "
        "above the note. The card's own text is shorter than the tallest card "
        "in its row, and the row's height is a decision about the table, not "
        "about this card."
    ),
    "dead|span.asia-spotlight-all-body": (
        "The spotlight is a navy plate whose link is pinned to its foot "
        "(`margin-top: auto`), so the plate reads as a block of colour with "
        "its statement at the top and its way on at the bottom. Measured at "
        "920px the body ends 161.6px above the pinned link. That space is "
        "inside a deliberately coloured block, and the block is the palette's "
        "counter-field."
    ),
    "dead|span.vc-type-tag.mono": (
        "The venue-type badge is a top-aligned marker in the card header row "
        "(`align-items: flex-start`), level with the first line of the venue "
        "name beside it. Measured at 718px the badge is 14px tall and the "
        "header row is 116px because the name and country wrap to three lines. "
        "The 102px under the badge is the card's own air, and a badge hung at "
        "the foot of the row would read as belonging to the spec table instead "
        "of to the name."
    ),
    "orphan|aside.wmp-time-rail": (
        "The watchmaking timeline rail is a sticky rail, not a panel: it is "
        "`position: sticky; top: calc(var(--header-h) + 120px)` with "
        "`align-self: start` and `max-height: calc(100vh - ...); overflow-y: "
        "auto`, so the reader scrolls the rail itself and it never leaves the "
        "viewport. Measured at 1101px it fills 12% of a 6075px row because the "
        "timeline beside it is 6075px long. The rail is the timeline's "
        "column, not 6075px of nothing."
    ),
    "orphan|div.pom-card-image": (
        "The dossier card is two columns: the object image on the left and the "
        "dossier body on the right. The image column is `align-self: start`, so "
        "it is as tall as the photograph and the body's own text is what makes "
        "the card 709px tall. Measured at 720px the image column fills 17% of "
        "that row because the body beside it is 590px of written dossier. The "
        "card is not short; the picture is."
    ),
    "scattered|div.guides-grid": (
        "The three guide cards are one ruled row of three - coral, yellow, "
        "navy - so their centres sit at 1/6, 1/2 and 5/6 of the row. Measured "
        "at 879px two of the cards' centres are 67% of the row's WIDTH apart. "
        "The instrument measures the space BETWEEN cells, and in a three-cell "
        "row that space is the column, not a scatter."
    ),
}


def main() -> int:
    sweep = sys.argv[1] if len(sys.argv) > 1 else None
    with open(BASELINE, "r", encoding="utf-8") as fh:
        baseline = json.load(fh)

    reasons = dict(baseline.get("reasons") or {})

    if sweep:
        with open(sweep, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        found = {}
        for m in data.get("measurements") or []:
            for f in m.get("findings") or []:
                if f.get("kind") == "overflow":
                    continue  # an absolute failure; it is never explained away
                key = "%s|%s" % (f.get("kind"), f.get("sel"))
                if key not in found:
                    found[key] = {
                        "metric": f.get("metric"),
                        "detail": f.get("detail"),
                        "at": "%s @%spx" % (m.get("route"), m.get("w")),
                        "n": 0,
                    }
                found[key]["n"] += 1
        print("distinct decisions measured: %d" % len(found))
        for key, info in sorted(found.items()):
            if key in REASONS:
                reasons[key] = REASONS[key]
            elif key not in reasons:
                print("NEEDS A REASON  %-34s %s" % (key, info["detail"]))
    else:
        for key, why in REASONS.items():
            reasons[key] = why

    baseline["reasons"] = reasons
    with open(BASELINE, "w", encoding="utf-8") as fh:
        json.dump(baseline, fh, indent=2)
        fh.write("\n")
    print("baseline reasons written: %d" % len(reasons))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
