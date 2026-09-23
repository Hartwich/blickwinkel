# Blickwinkel

Blickwinkel is an original, phone-first social party game for 3–8 people. Its separate repository belongs in `local-games/blickwinkel` beside the other Open Party Lab games. A ten-task session mixes four secret picks, two text prompts, two photo prompts and two drawing prompts. The shared screen presents each task and reveals entries and scores; phones handle private submissions and votes.

For picks, players select someone else; choosing a popular answer earns two points, and being picked earns one point per vote. In the creative tasks, everyone submits a short text or a compressed JPEG. Entries are anonymous during judging, and nobody can vote for their own entry. Voters who choose a winning entry earn two points; each received vote earns the author one point, plus a small winner bonus. The server validates input, resolves timeouts and computes points. No prompt repeats within a session.

Photos and drawings are kept in the room's transient game state and sent to other players only after submission closes. Drawings can use a phone photo as a background or start from a blank canvas. Media is converted to a small JPEG on the phone before sending. Questions and tasks are original and localized in German and English.

## Run

From the platform root, run `npm run games:sync-local`, then `npm run typecheck` and `npm run build`. The game appears in the catalog for rooms with at least three players.

## Package exports

`@open-party-lab/game-blickwinkel` exposes the manifest, protocol, authoritative server game, DOM host surface, and phone controller builder. The phone uses the platform's reusable `social_party` layout.
