# Code Crew

**A detective game: one file in this code is the imposter.** Read the clues, question the crew, catch the lie, then call the vote.

Every crew member is a code file. Every clue card is a **real finding from [REA](https://github.com/morluto/rea)**, a reverse-engineering tool, run on small sample apps built for this game. Each card shows the exact file, line and column, and the real line of code.

![A playthrough of case 1: ask, present the clue, contradiction, vote, case closed](docs/media/code-crew-demo.gif)

## Play

Three cases, each a tiny app with six code files:

| Case | Difficulty | The twist |
|---|---|---|
| The Telemetry Leak | Rookie | A "telemetry" file says it only counts plays. |
| The Quiet Courier | Detective | The imposter hides what it loads and where it sends data. REA notices the hidden import and the disguised string. |
| The Diary Nobody Asked For | Chief Inspector | The scariest-looking file is innocent and says so. The quiet one is lying. |

Score: start at 60, **+20** for each lie you catch with a clue, **-4** per question, **-10** per wrong clue, **-20** per wrong vote. Two wrong votes and the imposter wins.

```
cd web
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in web/dist (no backend, no API key)
```

## What is real and what is authored

| Real (from REA) | Written by us |
|---|---|
| The import graph between files | The crew's names and roles |
| Network requests, routes and server names found in code | What each crew member *says* (their claims) |
| Reads of user name, host name, files and environment | The briefing and the "why it matters" lines |
| Dynamic imports and encoded strings | The sample apps themselves |

The build refuses a case unless **exactly the imposter lies** and every claim can be checked against a REA finding. `scripts/cases.test.mjs` re-checks that every clue in the shipped files exists in REA's raw output, that the raw output has not changed, that every snippet matches the source file, and that no ship file contains a spoiler word.

REA does **not** list the contents of a request body. So "it sends your score" is never shown as a finding: the cards say what REA saw (it reads the user name, it builds a request to that server).

## How a case is built

```
cases/<id>/ship/                the sample app (the "ship"), ES modules
cases/<id>/case.config.json     crew, roles, claims, the imposter (our story)
        |
        |  node scripts/run-rea.mjs <id>       (needs Node 22.19+)
        v
cases/<id>/rea-raw/*.json       REA's raw output, committed so the game never needs REA installed
        |
        |  node scripts/build-case.mjs
        v
web/public/cases/<id>.json      what the game reads
```

REA is pinned (`tools/package.json`, rea-agents 6.7.0) and installed with `--omit=optional --ignore-scripts`. It analyses the files as inert text and never runs them. To add a case: write a ship, a config, run the two scripts, run `node --test scripts/`.

## Tests

```
node --test scripts/                       # cases: clues are real, story holds up, no spoilers
node --test web/src/game.test.ts           # rules: scoring, voting, and the ideal detective can win every case (Node 22.18+)
```

## Art

The look is a dark space ship with bold crew colours, flat cartoon shading and thick outlines. The crew are **original** "pod bots" (capsule body, round porthole, antenna). No other game's characters, code or assets are used.

## Limits

- Three small, hand-built sample apps. This is a game about reading code evidence, not a security scanner.
- REA reports static facts. Static imports and relationships do not prove what runs, and REA says so in its own output.
- Case difficulty has been tested only by the unit tests (an ideal player can win each case and no innocent can be caught out). It has not been playtested with people yet.
