# LifeQuest · Crossroads local v1.0

**Local work only:** No Vercel deployment, GitHub push, paid service, or production change was made.

## Play

Open `index.html` in a modern browser, or serve this folder locally for the smoothest download behavior. The illustrated artwork is embedded. Progress, mission choices, and practice notes stay in this browser under the existing LifeQuest save key. No account is needed.

New players get a three-step welcome tour from Pixel after picking a name. The full **How to play** guide is always one tap away in the top navigation.

## How to play (summary)

1. **Pick a place.** Tap a glowing building on the Town map.
2. **Meet your guide.** Each district has a mentor: Maya (money), Jace (online life), André (housing), Priya (work).
3. **Play the quest.** Inspect, compare, choose, and write short notes. Every choice explains its trade-off; there is no game over.
4. **Keep what you learn.** First completion earns 75–100 XP and a badge (150 XP per level) and unlocks a downloadable toolkit. Replays are free practice.

The in-game guide also covers the anatomy of a quest screen, controls and keyboard use, comfort settings, privacy, and tips for playing together. Inside any quest, **How quests work** opens a quick refresher without leaving the quest.

## Sixteen playable quests · 1550 XP across six districts

- Paycheck Mystery · Budget Boss · **NEW: Credit Card Chaos · The $600 Surprise** — Money District
- Post or Pass? · Scam or Sponsor? · Build Your Brand · Views vs. Value — Signal Studio
- Lease Detective · Move-In Ready — Home Base
- Offer Decoder · Interview Ready — Career Tower
- **NEW: Insurance Decoder · Appointment Ready — Wellness Center** (guide: Nia Carter)
- **NEW: Compound Curve · Goal Mapper — Future District** (guide: Sam Okafor)

## Wellness Center and Future District

`Insurance Decoder` (QUEST 13) teaches six plan words, compares the total yearly cost of two fictional plans across a quiet, busy, and big year (Bronze wins small years; Silver wins the $14,000-surgery year, $8,565 vs. $11,520), practices staying in network, and builds an enrollment checklist. Badge: Plan Picker. Toolkit: Health Plan Picker.

`Appointment Ready` (QUEST 14) sorts four situations into primary care, urgent care, the ER, or telehealth, packs for a visit, compares a clinic bill ($240) with the Explanation of Benefits ($85 owed), and writes a billing call script. Badge: Care Navigator. Toolkit: Appointment and Bill Check Kit.

`Compound Curve` (QUEST 15) explains retirement-form terms, runs a growth simulator by start age and monthly amount (illustrated at a steady 6%: $100/month from 25 grows to about $227,000 by 67), claims a full employer match, handles an old 401(k) when changing jobs, and shows what fees cost over 30 years. Badge: Long Game. Toolkit: Retirement Starter Plan.

`Goal Mapper` (QUEST 16) turns three goals into target amounts and timelines that must fit a $300 monthly budget, plans a $1,000 tax refund, and finishes a future-proof checklist and 90-day note. Badge: Goal Getter. Toolkit: Future Goals Map.

### Painted art

The new guides and rooms were painted in Canva to match the existing art. The game reads them from the `art/` folder (see `art/README.txt` for the four file names and Canva links). Until those files are added, each spot shows a built-in illustration, so nothing appears broken. Keep `art/` next to `index.html` when deploying.

## Money District, complete

Maya Reyes now runs all four Money District quests, and the Money Lab room has hotspots for every one.

`Credit Card Chaos` reads six lines of a fictional card statement, runs a payoff simulator on $1,200 at 24.99% APR (minimum only: about 61 months and $926 interest; $150/month: 9 months and $126), judges a 0% balance-transfer offer, handles a nearly missed due date, and sets guardrails. Awards 100 XP, the Card Smart badge, and the Credit Card Payoff Planner with the player's chosen plan.

`The $600 Surprise` reads a repair estimate line by line (with an optional item that can be postponed), compares the real cost of four ways to pay (savings plus a 0% shop plan, a credit card, a payday loan, or skipping bills), plans how to rebuild the emergency fund, and writes a short plan. Awards 100 XP, the Shock Absorber badge, and the Surprise Expense Game Plan.

Quest numbers are now consistent: Money 01–04, Signal Studio 05–08, Home Base 09–10, Career Tower 11–12.

## Career Tower chapter

Priya Shah guides two six-stage quests in an illustrated twelfth-floor career lounge.

`Offer Decoder` compares two fictional job offers by turning hourly pay into a yearly picture (pay × hours × 52, plus retirement match, minus health premiums and commute costs), inspects six offer-letter terms, handles a reply deadline with a schedule surprise, and drafts a reply with tap-to-add starter sentences. Awards 100 XP and unlocks the Job Offer Comparison Sheet, which includes the player's own notes.

`Interview Ready` decodes a fictional job posting, builds a STAR story with live coaching and a strength meter, handles a pay-expectation question and an inappropriate family-plans question, and drafts a thank-you note. Awards 100 XP and unlocks the Interview Prep Card, which includes the player's STAR story and note.

Employment rules vary by state and city. The game teaches what to check and where to get official help, not one universal legal answer.

## Controls and accessibility

Mouse, keyboard, and touch are supported. Mission controls are native buttons, checkboxes, and text fields. Key phone controls meet a 44-pixel minimum. Esc closes dialogs. Reduced motion can be enabled in game settings or through the device preference.

## Local QA

Set `LIFEQUEST_CHROME` to your Chrome/Chromium path if it is not the Windows default.

- `qa/new-districts-test.js` — Wellness Center and Future District at 390 × 844: art fallbacks, hotspots, plan and growth math, the over-budget gate, all four quests, toolkits, persistence, and v0.9 save migration.
- `qa/money-test.js` — both new Money District quests at 390 × 844, payoff math, touch sizing, overflow, downloads, persistence, and v0.8 save migration.
- `qa/career-howto-test.js` — welcome tour, How to Play, quest help, both Career Tower quests at 390 × 844, touch sizing, overflow, downloads, persistence, and v0.7 save migration.
- `qa/smoke-test.js` — all sixteen quests on desktop (1550 XP, sixteen toolkits), mobile Views vs. Value flow, and v0.6 save migration.
- `qa/home-base-test.js` — both Home Base quests on a phone viewport.
- `qa/capture-previews.js` — regenerates the included screenshots.

See `QA_NOTES.md` for verified results.

## Still to build

- **Painted art files:** download the four Canva images into `art/` (or send them over to be baked into `index.html`). Exterior building paintings for the two new districts were not made because the Canva image credits ran out.
- **Real-device testing** on iPhone Safari and Android before sharing.
- **Deployment** to Vercel when ready to share.
- **Progress backup:** progress lives in one browser; an export/import code would let players move devices.
- **Project structure:** the game is one ~2.2 MB HTML file; splitting art, styles, and quests into separate files would make future updates easier.
