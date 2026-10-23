# Phase 0 spike: result **GO** (2026-10-23)

Tool: `rea-agents` 6.7.0 (npm, MIT), installed in `tools/` with `--omit=optional --ignore-scripts`, run with portable Node 22.23.4 (`D:\tools\node-v22.23.4-win-x64`, sha256 verified). Command: `analyze-javascript-application <ship dir> --json`. It reads the files as inert text and never runs them.

Sample target: `cases/case-1/ship` (6 ES-module files, one planted imposter). Raw output: `cases/case-1/rea-raw/analyze-javascript-application.json` (740 KB).

## What REA gave us (all with file, line and column)
| Clue we want | Where in the REA JSON |
|---|---|
| Who imports whom, and which Node built-ins (`node:https`, `node:os`, `node:fs`...) | `normalized_result.graph.edges` where `relation = "imports"` (`properties.kind = "static-import"` is the statement itself) |
| "Builds a network request" | `semantic_graph.relations` where `relation = "constructs-request"` (analytics.js:10) |
| Request fields (host, path, method, headers) | `relation = "supplies-request-field"`, `properties.field` |
| The server it talks to | `semantic_graph.nodes` of kind `literal` with the string value (analytics.js:6 `collector.sus-station.example`); `graph.nodes` of kind `endpoint` (`/v1/collect`) |
| Reads the user name / host name | `semantic_graph.nodes` kind `expression` labelled `read:/userInfo`, `read:/hostname` (analytics.js:9) |
| Reads and writes files | `read:/readFileSync` (scoreboard.js:9), `read:/writeFileSync` (scoreboard.js:16) |

## What REA does not give (so the game must not pretend it does)
- The *contents* of the request body are not listed. "It sends the score" is therefore not a REA finding; the card says "reads the user name and host name" (REA) and the narrative explains why that is suspicious (authored, labelled as such).
- REA warns that dynamic or obfuscated code can stay unresolved. Case 2 (sneaky imposter) must be tested against that limit.

## Design consequence
Evidence cards = real REA findings + the real source line. Testimony and the "why this is suspicious" sentence are authored and are marked as such in the UI.
