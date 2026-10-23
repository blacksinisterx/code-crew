# Code Crew: find the imposter hiding in the code

Status: **plan only, nothing built.** Written 2026-10-23. Free only, real measured numbers only in posts, git identity `blacksinisterx <aiza.ali03@gmail.com>`, no co-author trailers.

## The idea in one breath
A small app is the spaceship, its code files are the crew, and **one file is the imposter** (it quietly steals the score). You are the detective: read the clues, question the crew, catch whoever's story does not match the evidence, then vote. The clues are **real findings produced by REA**, an AI reverse-engineering tool, not made-up text.

Why it is good: it looks and plays like a social-deduction game (instantly understandable), it is also a real code-audit demo (resume-credible, fits the AppSec profile), and REA does genuine work in it.

## What the player sees (5 screens)
1. **Case file:** the "ship" (a small app), the crew list (6 modules, each with a role), the mission ("someone is leaking the score").
2. **Evidence board:** the crew as dots, lines between them = who imports whom. Click a dot, get clue cards ("reads local storage", "opens a network connection") with the exact file and line.
3. **Interrogation:** pick a crew member and ask 3 fixed questions ("Who do you talk to?", "What do you read or write?", "Do you touch the network?"). Each answers with a claim. The imposter's claim contradicts the evidence; the player must notice.
4. **Vote:** accuse one. Wrong vote costs points; fewer clues used = higher score.
5. **Reveal and report:** the imposter's evidence trail (file, line, what it did), plus a shareable case report card.

MVP = 3 cases: (1) an obvious imposter, (2) a sneaky one (hidden behind an encoded string or a dynamic import), (3) a **red herring**: an innocent module that *looks* scary.

## How REA is really used (honest)
- REA reads the sample app's files **without running them** (static analysis) and returns modules, imports and relationships with evidence.
- A build script turns that output into `case.json`. Evidence cards come from REA; the crew's "claims" (their testimony) are written by us.
- The sample app is **ours** (a tiny station-dashboard / mini-2048 with a planted imposter module). No one else's software, no trademarks.
- Not in the MVP: analysing any app live in the browser (REA needs Node and runs locally). The web game plays the pre-analysed cases.

## Phases (rough, with a coding agent; not guaranteed)
| Phase | What | Time |
|---|---|---|
| 0 | **Spike, go/no-go:** run REA on a tiny sample app, read the raw output, decide which fields become clues | 0.5 day |
| 1 | Build the sample "ship" app (6 modules + the planted imposter), run REA, save the raw outputs | 0.5-1 day |
| 2 | `build-case` script, `case.json` for 3 cases, plus a test that **every clue cites a real file:line from the REA output** (no invented evidence) | 1 day |
| 3 | Web UI: board, interrogation, vote, reveal (Vite + React, no backend) | 1-1.5 days |
| 4 | Polish, README with limits, deploy on Vercel (free), record GIFs | 0.5-1 day |
| 5 | LinkedIn post and X thread drafts, using only numbers we actually measured | 0.5 day |

Total about **3-5 days**.

## Needs your OK before Phase 0
- **Node version:** REA needs Node 22.19+ (or 24.11+). This laptop has Node 20.12.2. Safest: download a **portable** Node 22 zip (about 30 MB, from nodejs.org) into its own folder and use it only for this project, so wrangler, Vite and everything else stays untouched. I will not download until you say yes.
- **Do not run `npx rea-agents setup`.** It edits your AI agent's config. The plan uses only the CLI command (`analyze-javascript-application`), pinned to one version (6.7.0 today) because REA changes quickly.

## Risks and fallbacks
- **REA's output on a plain app may be thin** (e.g. old-style scripts with no imports show few relationships). That is why Phase 0 is a spike: we write the sample app with real `import`/`require` so there are relationships to find. If REA still gives too little, fallback is a .NET sample (REA reads .NET assemblies statically) or fewer, simpler clues.
- **Clues feel obvious or unfair.** Mitigation: 3 playtests with friends; only report "X of Y found the imposter" if we really ran it.
- **REA is third-party and fast-moving.** Pin the version, keep the raw outputs in the repo so the game never depends on REA being installed.

## Stretch (only after the MVP works)
- **Bring your own app:** `code-crew build ./my-app` runs REA on *your* code and makes a case from it. Strong portfolio piece.
- Crew members "talk" with local Ollama models (qwen2.5 / hermes3), flagged as AI-written flavour text.
- Timer and sound.

## LinkedIn angle (30-second demo)
Board with a suspicious dot, click it, the evidence card shows the real line of code, interrogate, catch the contradiction, vote, reveal. Caption idea: "I turned a code audit into an Among-Us-style detective game. The clues are real findings from an AI reverse-engineering tool." Posts may only state numbers we measured (cases, clues, playtests).

## Done means
- 3 playable cases live on a free URL, no sign-up.
- Test passes: every clue maps to a real REA finding.
- README states plainly what is real (REA findings) and what is authored (testimony).
- GIF and one post draft ready.
