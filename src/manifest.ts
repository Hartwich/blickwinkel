import type { GameManifest } from "@open-party-lab/game-core";

export const blickwinkelManifest = {
  id: "blickwinkel",
  displayName: "Blickwinkel",
  description: "Wie gut kennt ihr euch? Stimmt ab, schreibt Antworten, macht Fotos und zeichnet auf Bildern.",
  minPlayers: 1,
  maxPlayers: 16,
  hostView: "BlickwinkelHostScene",
  controllerView: "blickwinkel",
  controllerLayout: "social_party",
  supportsTeams: false,
  scoreScope: "game",
  estimatedRoundDurationMs: 900_000,
  roundCompletionMode: "wait_for_ready",
  phaseDurations: {
    roundIntroMs: 2_000,
    countdownMs: 1_000,
    resultMs: 4_000,
    scoreboardMs: 5_000
  },
  ownsScreens: ["round_intro", "result"],
  visual: { accent: "#e76f51", icon: "chat", eyebrow: "Party stories" },
  audio: {
    track: { profile: "gentle", bpm: 96, rootMidi: 60, masterGain: 0.1 },
    trackByStage: {
      vote: { profile: "mystery", bpm: 104, rootMidi: 60, masterGain: 0.09 },
      showcase: { profile: "sugarCountry", bpm: 108, rootMidi: 60, masterGain: 0.11 },
      gallery: { profile: "sugarCountry", bpm: 108, rootMidi: 60, masterGain: 0.11 },
      winner: { profile: "sugarCountry", bpm: 118, rootMidi: 67, masterGain: 0.13 },
      scoreboard: { profile: "sugarCountry", bpm: 108, rootMidi: 60, masterGain: 0.11 },
      finished: { profile: "sugarCountry", bpm: 94, rootMidi: 60, masterGain: 0.1 }
    }
  },
  hostChrome: { hud: false, roomCode: false },
  controllerChrome: { bare: true, hideScore: true }
} as const satisfies GameManifest;

export const manifest = blickwinkelManifest;
