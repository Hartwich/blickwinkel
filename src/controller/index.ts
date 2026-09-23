import type { ControllerLayoutKey } from "@open-party-lab/game-core";
import { blickwinkelManifest } from "../manifest.js";
import type { BlickwinkelControllerState, BlickwinkelTaskKind } from "../protocol.js";

interface ControllerContext {
  state: {
    preferredLanguage?: "de" | "en";
    room?: { language?: "de" | "en"; players?: Array<{ id: string; name: string }> } | null;
    player?: { id: string } | null;
    game?: { phase?: string; roundNumber?: number; state?: unknown } | null;
  };
  onInput(input: unknown): void;
}

const taskNames: Record<BlickwinkelTaskKind, { de: string; en: string }> = {
  pick: { de: "Wer passt?", en: "Who fits?" },
  text: { de: "Textaufgabe", en: "Write a line" },
  photo: { de: "Fotoaufgabe", en: "Photo challenge" },
  draw: { de: "Zeichenaufgabe", en: "Drawing challenge" }
};

export const controllerGame = {
  id: blickwinkelManifest.id,
  layoutKey: "social_party" as ControllerLayoutKey,
  buildLayout({ state, onInput }: ControllerContext) {
    const game = (state.game?.state ?? {}) as Partial<BlickwinkelControllerState>;
    const language = state.room?.language ?? state.preferredLanguage ?? "de";
    const en = language === "en";
    const playerId = state.player?.id ?? "";
    const round = game.round;
    const kind = round?.kind ?? "pick";
    const inPlay = state.game?.phase === "playing";
    const stage = inPlay ? game.stage ?? "waiting" : game.stage === "finished" ? "finished" : "waiting";
    const participants = game.playerNames ?? state.room?.players ?? [];
    const entries = game.entries ?? [];
    const roundId = round?.id ?? "";
    const send = (input: Record<string, unknown>) => {
      if (!playerId || !roundId || !inPlay) return;
      onInput({ ...input, playerId, roundId, roundIndex: game.roundIndex ?? 0, runNumber: state.game?.roundNumber ?? 0, sentAt: Date.now() });
    };
    const choices = stage === "submit" && kind === "pick"
      ? participants.filter(({ id }) => id !== playerId).map(({ id, name }) => ({ id, label: name }))
      : entries.map((entry) => ({
        id: entry.id,
        label: entry.label,
        text: entry.text,
        media: entry.media,
        votes: entry.votes,
        authorName: entry.authorName,
        disabled: stage === "vote" && entry.id === game.ownEntryId
      }));
    const scores = participants
      .map(({ id, name }) => ({ id, name, score: game.totals?.[id] ?? 0 }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    const helperText = stage === "submit"
      ? game.hasSubmitted
        ? en ? "Your entry is sealed. Watch the shared screen." : "Deine Einsendung ist angekommen. Schau auf den gemeinsamen Bildschirm."
        : kind === "pick"
          ? en ? "Choose someone else. Your vote stays secret until the reveal." : "Wähle eine andere Person. Dein Tipp bleibt bis zur Auflösung geheim."
          : kind === "text"
            ? en ? "Write a short answer. The group will vote anonymously." : "Schreibe eine kurze Antwort. Danach stimmt die Gruppe anonym ab."
            : kind === "photo"
              ? en ? "Take a photo or choose one from your phone. Review it before sending." : "Nimm ein Foto auf oder wähle eines aus. Prüfe es vor dem Senden."
              : en ? "Draw over a photo or on blank paper. Send only when you are happy with it." : "Zeichne auf ein Foto oder auf leeres Papier. Sende erst, wenn es dir gefällt."
      : stage === "vote"
        ? game.hasSubmitted
          ? en ? "Vote received. The authors will be revealed soon." : "Stimme abgegeben. Die Namen werden gleich aufgelöst."
          : en ? "Choose your favourite. You cannot vote for your own entry." : "Wähle deinen Favoriten. Die eigene Einsendung ist gesperrt."
        : stage === "reveal"
          ? en ? "The names and points are now on the shared screen." : "Die Namen und Punkte sind jetzt auf dem gemeinsamen Bildschirm."
          : stage === "finished"
            ? en ? "The final score is in." : "Die Endwertung steht fest."
            : en ? "Get ready for the next task." : "Die nächste Aufgabe beginnt gleich.";

    return {
      kind: "social_party",
      language,
      stage,
      taskKind: kind,
      resetKey: `${state.game?.roundNumber ?? 0}:${roundId}`,
      roundLabel: `${en ? "Round" : "Runde"} ${Math.min((game.roundIndex ?? 0) + 1, game.rounds?.length ?? 10)} / ${game.rounds?.length ?? 10} · ${taskNames[kind][language]}`,
      prompt: round?.prompt || (en ? "How well do you know each other?" : "Wie gut kennt ihr euch?"),
      helperText,
      deadline: game.finishAt ?? null,
      durationMs: stage === "vote" ? 25_000 : kind === "pick" ? 25_000 : kind === "text" ? 70_000 : kind === "photo" ? 90_000 : 120_000,
      submittedCount: game.submittedCount ?? 0,
      playerCount: participants.length,
      hasSubmitted: Boolean(game.hasSubmitted),
      disabled: !inPlay || Boolean(game.hasSubmitted),
      selectedId: game.selectedId,
      choices,
      scores,
      onSubmitPick: (targetPlayerId: string) => send({ type: "blickwinkel:pick", targetPlayerId }),
      onSubmitText: (text: string) => send({ type: "blickwinkel:text", text }),
      onSubmitMedia: (media: string) => send({ type: "blickwinkel:media", media }),
      onVote: (entryId: string) => send({ type: "blickwinkel:ballot", entryId })
    };
  }
} as const;
