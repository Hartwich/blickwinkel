import type { ControllerLayoutKey } from "@open-party-lab/game-core";
import { blickwinkelManifest } from "../manifest.js";
import type { BlickwinkelControllerState } from "../protocol.js";

interface ControllerContext {
  state: {
    preferredLanguage?: "de" | "en";
    room?: { language?: "de" | "en"; players?: Array<{ id: string; name: string; avatar?: string }> } | null;
    player?: { id: string } | null;
    game?: { phase?: string; roundNumber?: number; state?: unknown } | null;
  };
  onInput(input: unknown): void;
}

export const controllerGame = {
  id: blickwinkelManifest.id,
  layoutKey: "social_party" as ControllerLayoutKey,
  buildLayout({ state, onInput }: ControllerContext) {
    const game = (state.game?.state ?? {}) as Partial<BlickwinkelControllerState>;
    const language = state.room?.language ?? state.preferredLanguage ?? "de";
    const playerId = state.player?.id ?? "";
    const round = game.round;
    const kind = round?.kind ?? "pick";
    const inPlay = state.game?.phase === "playing";
    const stage = inPlay
      ? game.stage === "avatar" || game.stage === "submit" || game.stage === "vote" ? game.stage : "waiting"
      : game.stage === "finished" ? "finished" : "waiting";
    const participants = game.playerNames ?? state.room?.players ?? [];
    const entries = game.entries ?? [];
    const roundId = round?.id ?? "";
    const send = (input: Record<string, unknown>) => {
      if (!playerId || !roundId || !inPlay) return;
      onInput({ ...input, playerId, roundId, roundIndex: game.roundIndex ?? 0, runNumber: state.game?.roundNumber ?? 0, sentAt: Date.now() });
    };
    const choices = stage === "submit" && kind === "pick"
      ? participants.filter(({ id }) => participants.length === 1 || id !== playerId).map(({ id, name, avatar }) => ({ id, label: name, avatar }))
      : entries.map((entry) => ({
        id: entry.id,
        label: entry.authorName ?? entry.label,
        avatar: participants.find(({ id }) => id === entry.authorId)?.avatar,
        disabled: stage === "vote" && entry.id === game.ownEntryId
      }));
    return {
      kind: "social_party",
      language,
      stage,
      taskKind: kind,
      resetKey: `${state.game?.roundNumber ?? 0}:${roundId}`,
      maxStrokes: round?.maxStrokes,
      basePhoto: game.basePhoto,
      hasSubmitted: Boolean(game.hasSubmitted),
      disabled: !inPlay || Boolean(game.hasSubmitted),
      selectedId: game.selectedId,
      choices,
      onSubmitPick: (targetPlayerId: string) => send({ type: "blickwinkel:pick", targetPlayerId }),
      onSubmitAvatar: (media: string) => {
        if (!playerId || !inPlay) return;
        onInput({ type: "blickwinkel:avatar", playerId, runNumber: state.game?.roundNumber ?? 0, media, sentAt: Date.now() });
      },
      onSubmitText: (text: string) => send({ type: "blickwinkel:text", text }),
      onSubmitMedia: (media: string, strokeCount?: number) => send({ type: "blickwinkel:media", media, strokeCount }),
      onVote: (entryId: string) => send({ type: "blickwinkel:ballot", entryId })
    };
  }
} as const;
