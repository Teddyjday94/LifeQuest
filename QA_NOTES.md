# QA summary · LifeQuest v1.0

Verified locally on October 23, 2026 with headless Chromium.

## Automated gameplay

- `new-districts-test.js`, phone 390 × 844 with touch: six district cards; both new districts render guide portraits through the art fallback, built-in room illustrations, and hotspots without overflow. Checked plan totals ($2,570 vs. $4,105 quiet year; $8,565 Silver in the big year), the $227,016 growth illustration, 44 px simulator buttons, the over-budget goal gate, all four quests, four toolkits, downloads, persistence, and v0.9 migration (1150 XP kept).
- Also verified the new rooms with stand-in copies of the Canva paintings in `art/`: hotspots land on the desk, board, laptop, and goal board as designed.
- `smoke-test.js` completes all sixteen quests on desktop: 1550 XP, sixteen toolkits, persistence.

- `money-test.js`, phone viewport 390 × 844 with touch: all four Money District quests are playable with room hotspots; completed Credit Card Chaos and The $600 Surprise with gating checks, payoff figures ($926 minimum-only interest, $126 at $150/month, $0 paid in full), the postponed-item total ($535), payday-loan rollover cost (+$240), starter sentences, both toolkit downloads, 200 XP, persistence of the chosen plans, ≥ 44 px targets, and no overflow. v0.8 save migration kept 950 XP and drafts.
- `smoke-test.js` now completes all twelve quests on desktop: 1150 XP, twelve toolkits, persistence.

- `career-howto-test.js`, phone viewport 390 × 844 with touch: onboarding opens the three-step tour; "Read the full guide" closes it, remembers it, and opens How to Play; all guide sections render with no horizontal overflow; four nav targets ≥ 44 px; the tour stays closed after reload and Esc closes it when replayed. Completed Offer Decoder and Interview Ready from a clean profile, including disabled-until-done gating, both offer calculations ($42,890 and $40,896), branching feedback, starter sentences, STAR coaching and meter, the quest-help dialog returning to the same stage, both toolkit downloads, 200 XP, two badges, two unlocked toolkits, and persistence of the reply and STAR story. Offer cards, letter terms, and STAR options all ≥ 44 px.
- v0.7 migration: a save with eight completions and 750 XP loaded as 8 of 10 quests, kept existing drafts, skipped the tour, and opened Career Tower.
- `smoke-test.js`, desktop 1365 × 900: all ten quests from a clean profile, 950 XP, ten journal completions, ten toolkits, persistence after reload; mobile Views vs. Value flow; v0.6 migration.
- `home-base-test.js`: both Home Base quests on a phone viewport.
- Browser console and page errors stayed clean across all suites.

## Visual review

- Reviewed screenshots of the map, tour, How to Play, Career Tower district, every Offer Decoder and Interview Ready stage, quest help, and toolkit at 1440 px and 390 px.
- Found and fixed during review: unstyled Home Base mission dialogue, clipped Home Base side note, unreadable Home Base map chip label, and a 2 px phone overflow from the guide's step arrows.

## Content safeguards

- All employers, offers, postings, people, and numbers are fictional.
- Wellness content is general guidance with repeated “not medical advice; in an emergency, call 911” notes. It covers plan terms, total yearly cost, networks, no-cost preventive care at in-network providers for many plans, emergency surprise-billing protections, EOB-versus-bill checks, and financial assistance policies at nonprofit hospitals.
- Future content labels every growth figure as a 6% illustration, not a promise; notes match vesting, the usual income tax plus 10% additional tax for early cash-outs before 59½ (with exceptions), and fee drag.
- Money content uses fictional cards, lenders, and prices; payoff numbers are computed, not hard-coded. It notes that real minimum payments shrink over time, that 0% deals and shop plans need their terms read, that payments 30+ days late can be reported to credit bureaus, and that a typical $15-per-$100 payday fee is an APR near 400%.
- Employment content stays general and repeatedly notes that rules vary by state and city: at-will employment, overtime, pay-range postings, salary-history limits, background-check consent (FCRA), and the EEOC's guidance against questions about pregnancy or family plans.
- Educational material only, not individualized legal, tax, or financial advice.

## Delivery boundary

No publishing, deployment, GitHub push, account connection, payment, or paid change was performed. Physical-device Safari and Android testing remains a sensible step before any public release. Fonts load from Google Fonts as before; offline play falls back to system fonts.
