# Blickwinkel

Blickwinkel is an original, phone-first social party game for 1–16 people. Its separate repository belongs in `local-games/blickwinkel` beside the other Open Party Lab games. Each player takes a character selfie before the first task. A ten-task session mixes four picks, two text prompts, two photo prompts and two drawing prompts. One drawing task edits another player's selfie; another limits the drawing to one or two strokes.

For picks, players select a person; choosing a popular answer earns two points, and being picked earns one point per vote. A solo player can select themselves. In creative tasks, everyone submits a short text or a compressed JPEG. The host shows each result on its own with an animation and audio cue, then shows all results together. Only then does voting open. Phone ballots show names and character photos, with no answer previews and no vote timer; nobody can vote for their own entry. Voters who choose a winning entry earn two points; each received vote earns the author one point, plus a small winner bonus. The host then displays the current scores and a countdown to the next task.

Photos and drawings are kept in the room's transient game state. Creative content is revealed on the host; controllers receive only names and character photos for voting. Drawings can use a phone photo as a background, start from a blank canvas, or use an assigned other player's character selfie. Media is converted to a small JPEG on the phone before sending. Questions and tasks are localized in German and English.

## Run

From the platform root, run `npm run games:sync-local`, then `npm run typecheck` and `npm run build`. The game appears in the catalog for rooms with 1–16 players.

## Package exports

`@open-party-lab/game-blickwinkel` exposes the manifest, protocol, authoritative server game, DOM host surface, and phone controller builder. The phone uses the platform's reusable `social_party` layout.
