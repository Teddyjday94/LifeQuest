# Changelog

## v1.0 · All of Crossroads

- Opened the Wellness Center (Nia Carter, health navigator) and the Future District (Sam Okafor, future planner): map pins, district cards, location pages with illustrated rooms, ambient props, mentor cards, and safety notes.
- Added Insurance Decoder (13), Appointment Ready (14), Compound Curve (15), and Goal Mapper (16), each six stages, 100 XP, a badge, and a personalized toolkit.
- Painted two guide portraits and two room interiors in Canva to match the existing art, with an `art/` drop-in folder and built-in fallbacks for every image.
- Map feature card now spotlights the two new districts; the legend, hero, tour, and How to Play guide cover all six districts.
- Expanded to sixteen quests and 1550 XP. v0.6 through v0.9 saves load unchanged.
- Added `qa/new-districts-test.js`; the full regression completes all sixteen quests.
- Still completely local. No deployment, GitHub activity, paid service, or account integration. (Canva image generation ran in the connected Canva account.)

## v0.9 · Money District complete

- Unlocked Credit Card Chaos (QUEST 03): statement reading, a payoff simulator with real amortization math, a balance-transfer decision, a late-payment decision, and guardrails. 100 XP, Card Smart badge, Credit Card Payoff Planner.
- Unlocked The $600 Surprise (QUEST 04): a line-by-line repair estimate with an optional postponable item, four funding options with their real extra cost, an emergency-fund rebuild decision, and a written plan. 100 XP, Shock Absorber badge, Surprise Expense Game Plan.
- Added Money Lab hotspots for Credit Card Chaos, Budget Boss, and The $600 Surprise (phone-safe positions) and Maya's notebook emote in her quests.
- Made quest numbering consistent across districts (01–12).
- Expanded to twelve quests and 1150 XP. v0.6, v0.7, and v0.8 saves load unchanged.
- Added `qa/money-test.js`; the full regression suite now completes all twelve quests.
- Still completely local. No deployment, GitHub activity, paid service, or account integration.

## v0.8 · Career Tower + How to Play

- Added a **How to play** tab: the four-step game loop, an annotated "anatomy of a quest" screen, how choices/XP/levels/toolkits work, a where-to-start district list with live progress, controls and comfort settings, privacy, and tips for playing together.
- Added Pixel's three-step welcome tour after onboarding (skippable, remembered, replayable from the guide or player menu), a "How to play" button on the map, and a "How quests work" quick-help dialog at the top of every quest that does not lose your place.
- Opened Career Tower as the fourth playable district with Priya Shah, an illustrated career lounge with ambient props, and a violet map chip and feature card.
- Added Offer Decoder (QUEST 09) and Interview Ready (QUEST 10), each six stages, 100 XP, a badge, and a personalized downloadable toolkit.
- Expanded the journal, toolkit shelf, map counts, and rewards from eight to ten quests and from 750 to 950 XP. v0.6 and v0.7 saves load unchanged; returning players are not interrupted by the tour.
- Fixed: Home Base mission dialogue was unstyled (plain text over a lilac box); it now matches the other districts.
- Fixed: the Home Base "Local rules matter" card clipped its text at the left edge.
- Fixed: the Home Base map chip label was white on a light background.
- Fixed: the browser tab title and description still said v0.6.
- Mobile navigation now stacks icon over label so four tabs fit at phone width with 44-pixel targets.
- Kept the release completely local. No deployment, GitHub activity, paid service, or account integration was performed.

## v0.7 · First Place, Clear Plan

- Opened Home Base as the third playable Crossroads district.
- Added a warm illustrated planning room with André, a lease desk, moving boxes, keys, ambient interactions, and two mission hotspots.
- Added Lease Detective, a six-stage rental-cost and lease-reading simulator with three fictional listings, six inspectable clauses, branching feedback, a saved note, 100 XP, a badge, and a downloadable Lease Ready Checklist.
- Added Move-In Ready, a six-stage listing-verification, tenant-screening, condition-record, renters-insurance, and repair-reporting simulator with branching feedback, 100 XP, a badge, and a downloadable Move-In Record Kit.
- Expanded the journal, map, toolkit shelf, local persistence, and reward system from six to eight playable quests and from 550 to 750 available XP.
- Preserved v0.6 save compatibility and all Money District and Signal Studio missions.
- Added responsive Home Base layouts, 44-pixel touch controls, keyboard-friendly native controls, reduced-motion support, and housing-specific feedback animation.
- Added focused Home Base QA, full eight-quest regression, migration checks, downloadable-file validation, and automated preview captures.
- Kept the release completely local. No deployment, GitHub activity, paid service, or account integration was performed.

## v0.6 · Views vs. Value

- Added the sixth playable mission, creator analytics simulator, Stay in the Game badge, and creator experiment toolkit.
- Fixed the Budget Boss animation redraw regression and expanded automated desktop/mobile QA.
