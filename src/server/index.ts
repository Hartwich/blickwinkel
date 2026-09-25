import {
  createBaseRoundState,
  roundPhaseDurations,
  transitionRoundState,
  type ScoreEntry,
  type ServerGame,
  type ServerGameContext
} from "@open-party-lab/game-core";
import { blickwinkelManifest } from "../manifest.js";
import { getCreativeTasks } from "../creativeContent.js";
import { getBlickwinkelQuestions } from "../questions.js";
import type {
  BlickwinkelControllerState,
  BlickwinkelEntry,
  BlickwinkelInput,
  BlickwinkelPublicState,
  BlickwinkelRound,
  BlickwinkelState,
  BlickwinkelTaskKind
} from "../protocol.js";

const roundKinds: readonly BlickwinkelTaskKind[] = [
  "pick", "text", "photo", "draw", "pick", "draw", "text", "pick", "photo", "draw", "pick", "draw"
];
const submitMs: Record<BlickwinkelTaskKind, number> = {
  pick: 25_000,
  text: 70_000,
  photo: 90_000,
  draw: 120_000
};
const showcaseMs = 3_600;
const galleryMs = 7_000;
const scoreboardMs = 7_000;
const countdownMs = 3_000;
const maxMediaChars = 85_000;
const jpegDataUrl = /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/;

function validMedia(media: unknown): media is string {
  if (typeof media !== "string" || media.length > maxMediaChars || !jpegDataUrl.test(media)) return false;
  const bytes = Buffer.from(media.slice("data:image/jpeg;base64,".length), "base64");
  return bytes.length >= 200 && bytes.length <= 64_000 &&
    bytes[0] === 0xff && bytes[1] === 0xd8 &&
    bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
}

function shuffle<T>(values: readonly T[], seed: number): T[] {
  const result = [...values];
  let state = (seed >>> 0) || 0x9e3779b9;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const target = (state >>> 0) % (index + 1);
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
}

function chooseRounds(context: ServerGameContext): BlickwinkelRound[] {
  const seed = context.now + context.roundNumber * 7919;
  const tasks = getCreativeTasks(context.language);
  const pools: Record<BlickwinkelTaskKind, BlickwinkelRound[]> = {
    pick: shuffle(getBlickwinkelQuestions(context.language), seed),
    text: shuffle(tasks.filter((task) => task.kind === "text"), seed + 1),
    photo: shuffle(tasks.filter((task) => task.kind === "photo"), seed + 2),
    draw: shuffle(tasks.filter((task) => task.kind === "draw" && !task.useOtherAvatar && !task.useOwnAvatar && !task.maxStrokes), seed + 3)
  };
  const otherAvatarDraws = shuffle(tasks.filter((task) => task.useOtherAvatar), seed + 4);
  const ownAvatarDraws = shuffle(tasks.filter((task) => task.useOwnAvatar), seed + 5);
  const limitedDraws = shuffle(tasks.filter((task) => task.maxStrokes), seed + 6);
  let drawIndex = 0;
  return roundKinds.map((kind) => {
    if (kind !== "draw") return pools[kind].shift();
    drawIndex += 1;
    if (drawIndex === 1) return (context.players.length > 1 ? otherAvatarDraws : ownAvatarDraws).shift();
    if (drawIndex === 2) return ownAvatarDraws.shift();
    if (drawIndex === 3) return pools.draw.shift();
    return limitedDraws.shift();
  }).filter((round): round is BlickwinkelRound => Boolean(round));
}

function avatarTargets(round: BlickwinkelRound, players: ServerGameContext["players"]): Record<string, string> {
  if (!round.useOtherAvatar && !round.useOwnAvatar) return {};
  return Object.fromEntries(players.map((player, index) => [
    player.id,
    round.useOtherAvatar ? players[(index + 1) % players.length]?.id ?? player.id : player.id
  ]));
}

function isKnownPlayer(context: ServerGameContext, playerId: string): boolean {
  return context.players.some((player) => player.id === playerId);
}

function hasSubmitted(record: Record<string, string>, playerId: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, playerId);
}

function stageState(state: BlickwinkelState, stage: BlickwinkelState["stage"], context: ServerGameContext, durationMs: number | null): BlickwinkelState {
  return {
    ...state,
    stage,
    finishAt: durationMs === null ? null : context.now + durationMs,
    phaseStartedAt: context.now,
    phaseEndsAt: durationMs === null ? null : context.now + durationMs,
    updatedAt: context.now
  };
}

function showScoreboard(
  state: BlickwinkelState,
  context: ServerGameContext,
  entries: BlickwinkelEntry[],
  winnerIds: string[],
  deltas: Record<string, number>
): BlickwinkelState {
  const totals = { ...state.totals };
  for (const [playerId, delta] of Object.entries(deltas)) {
    totals[playerId] = (totals[playerId] ?? 0) + delta;
  }
  return stageState({
    ...state,
    entries,
    winnerIds,
    roundScores: deltas,
    totals,
    submittedCount: Object.keys(state.ballotsByPlayer).length || Object.keys(state.submissionsByPlayer).length,
    message: context.language === "en" ? "Here are the current scores." : "Das ist der aktuelle Punktestand."
  }, "scoreboard", context, scoreboardMs);
}

function revealPick(state: BlickwinkelState, context: ServerGameContext): BlickwinkelState {
  const counts: Record<string, number> = Object.fromEntries(context.players.map(({ id }) => [id, 0]));
  for (const targetId of Object.values(state.submissionsByPlayer)) {
    if (targetId in counts) counts[targetId] = (counts[targetId] ?? 0) + 1;
  }
  const most = Math.max(0, ...Object.values(counts));
  const winnerIds = most > 0 ? Object.keys(counts).filter((id) => counts[id] === most) : [];
  const deltas: Record<string, number> = Object.fromEntries(context.players.map(({ id }) => [id, 0]));
  for (const [voterId, targetId] of Object.entries(state.submissionsByPlayer)) {
    if (winnerIds.includes(targetId)) deltas[voterId] = (deltas[voterId] ?? 0) + 2;
    deltas[targetId] = (deltas[targetId] ?? 0) + 1;
  }
  const names = new Map(context.players.map(({ id, name }) => [id, name]));
  const entries: BlickwinkelEntry[] = Object.entries(state.submissionsByPlayer).map(([authorId, targetId], index) => ({
    id: `pick-${index}`, label: String.fromCharCode(65 + index),
    authorId, authorName: names.get(authorId) ?? "?", text: names.get(targetId) ?? "?", votes: counts[targetId] ?? 0
  }));
  return stageState({ ...state, entries, winnerIds, roundScores: deltas, totals: Object.fromEntries(
    context.players.map(({ id }) => [id, (state.totals[id] ?? 0) + (deltas[id] ?? 0)])
  ), showcaseIndex: 0 }, "showcase", context, entries.length ? showcaseMs : galleryMs);
}

function prepareCreativeShowcase(state: BlickwinkelState, context: ServerGameContext): BlickwinkelState {
  const authors = shuffle(context.players.filter(({ id }) => hasSubmitted(state.submissionsByPlayer, id)),
    context.now + state.roundIndex * 101);
  const ownerById: Record<string, string> = {};
  const entries: BlickwinkelEntry[] = authors.map((author, index) => {
    const id = `entry-${state.roundIndex}-${index + 1}`;
    ownerById[id] = author.id;
    const content = state.submissionsByPlayer[author.id] ?? "";
    return {
      id,
      label: String.fromCharCode(65 + index),
      authorId: author.id,
      authorName: author.name,
      ...(state.round?.kind === "text" ? { text: content } : { media: content })
    };
  });
  const next: BlickwinkelState = {
    ...state,
    entries,
    entryOwnerById: ownerById,
    ballotsByPlayer: {},
    submittedCount: 0,
    showcaseIndex: 0,
    message: context.language === "en" ? "Watch every entry on the shared screen." : "Seht euch jede Einsendung auf dem Hauptbildschirm an."
  };
  return stageState(next, entries.length ? "showcase" : "gallery", context, entries.length ? showcaseMs : galleryMs);
}

function revealCreative(state: BlickwinkelState, context: ServerGameContext): BlickwinkelState {
  const counts: Record<string, number> = Object.fromEntries(state.entries.map(({ id }) => [id, 0]));
  for (const entryId of Object.values(state.ballotsByPlayer)) {
    if (entryId in counts) counts[entryId] = (counts[entryId] ?? 0) + 1;
  }
  const most = Math.max(0, ...Object.values(counts));
  const winnerIds = state.entries.length === 1
    ? [state.entries[0]!.id]
    : most > 0 ? Object.keys(counts).filter((id) => counts[id] === most) : [];
  const deltas: Record<string, number> = Object.fromEntries(context.players.map(({ id }) => [id, 0]));
  for (const [voterId, entryId] of Object.entries(state.ballotsByPlayer)) {
    const authorId = state.entryOwnerById[entryId];
    if (!authorId) continue;
    deltas[authorId] = (deltas[authorId] ?? 0) + 1;
    if (winnerIds.includes(entryId)) deltas[voterId] = (deltas[voterId] ?? 0) + 2;
  }
  for (const entryId of winnerIds) {
    const authorId = state.entryOwnerById[entryId];
    if (authorId) deltas[authorId] = (deltas[authorId] ?? 0) + (state.entries.length === 1 ? 2 : 1);
  }
  const names = new Map(context.players.map(({ id, name }) => [id, name]));
  const entries = state.entries
    .map((entry) => ({
      ...entry,
      votes: counts[entry.id] ?? 0,
      authorName: names.get(state.entryOwnerById[entry.id] ?? "") ?? "?"
    }))
    .sort((a, b) => b.votes - a.votes || a.label.localeCompare(b.label));
  const scored = showScoreboard(state, context, entries, winnerIds, deltas);
  if (!state.round?.useOwnAvatar && !state.round?.useOtherAvatar) return scored;
  const avatarsByPlayer = { ...state.avatarsByPlayer };
  for (const [editorId, media] of Object.entries(state.submissionsByPlayer)) {
    const targetId = state.avatarTargetByPlayer[editorId];
    if (targetId && validMedia(media)) avatarsByPlayer[targetId] = media;
  }
  return { ...scored, avatarsByPlayer };
}

function completeSubmit(state: BlickwinkelState, context: ServerGameContext): BlickwinkelState {
  return state.round?.kind === "pick" ? revealPick(state, context) : prepareCreativeShowcase(state, context);
}

function toPublic(state: BlickwinkelState, context: ServerGameContext): BlickwinkelPublicState {
  const {
    submissionsByPlayer: _submissions,
    ballotsByPlayer: _ballots,
    entryOwnerById: _owners,
    avatarsByPlayer: _avatars,
    avatarTargetByPlayer: _avatarTargets,
    ...publicState
  } = state;
  const rounds = state.rounds.map((round, index) => index <= state.roundIndex ? round : { ...round, prompt: "" });
  return {
    ...publicState,
    rounds,
    finishAt: state.finishAt === null ? null : Date.now() + Math.max(0, state.finishAt - context.now),
    entries: state.stage === "submit" ? [] : state.entries,
    playerNames: context.players.map(({ id, name }) => ({ id, name, avatar: state.avatarsByPlayer[id] }))
  };
}

export const serverGame: ServerGame<BlickwinkelState, BlickwinkelInput, BlickwinkelPublicState> = {
  manifest: blickwinkelManifest,

  createInitialState(context) {
    return {
      ...createBaseRoundState("round_intro", context.now, {
        durationMs: roundPhaseDurations.roundIntroMs,
        message: context.language === "en" ? "How well do you know one another?" : "Wie gut kennt ihr euch?"
      }),
      stage: "avatar",
      rounds: [],
      roundIndex: 0,
      round: null,
      finishAt: null,
      submissionsByPlayer: {},
      ballotsByPlayer: {},
      entryOwnerById: {},
      entries: [],
      submittedCount: 0,
      totals: Object.fromEntries(context.players.map(({ id }) => [id, 0])),
      roundScores: {},
      winnerIds: [],
      avatarsByPlayer: {},
      avatarTargetByPlayer: {},
      showcaseIndex: 0
    };
  },

  startRound(state, context) {
    const rounds = chooseRounds(context);
    const round = rounds[0] ?? null;
    return transitionRoundState({
      ...state,
      stage: "avatar",
      rounds,
      roundIndex: -1,
      round,
      finishAt: null,
      submissionsByPlayer: {},
      ballotsByPlayer: {},
      entryOwnerById: {},
      entries: [],
      submittedCount: 0,
      totals: Object.fromEntries(context.players.map(({ id }) => [id, 0])),
      roundScores: {},
      winnerIds: [],
      avatarsByPlayer: {},
      avatarTargetByPlayer: {},
      showcaseIndex: 0
    }, "playing", context.now, {
      startedAt: context.now,
      message: context.language === "en" ? "Take your character selfie." : "Macht zuerst euer Charakterfoto."
    });
  },

  handleInput(state, input, context) {
    if (state.phase !== "playing" || !input || typeof input !== "object" ||
        input.runNumber !== context.roundNumber || !isKnownPlayer(context, input.playerId)) return state;

    if (state.stage === "avatar" && input.type === "blickwinkel:avatar") {
      if (hasSubmitted(state.avatarsByPlayer, input.playerId) || !validMedia(input.media)) return state;
      const avatarsByPlayer = { ...state.avatarsByPlayer, [input.playerId]: input.media };
      const next = { ...state, avatarsByPlayer, submittedCount: Object.keys(avatarsByPlayer).length, updatedAt: context.now };
      return next.submittedCount >= context.players.length && state.round
        ? stageState({ ...next, submittedCount: 0, message: "" }, "countdown", context, countdownMs)
        : next;
    }

    if (!state.round || !("roundId" in input) || input.roundId !== state.round.id ||
        !("roundIndex" in input) || input.roundIndex !== state.roundIndex) return state;

    if (state.stage === "submit") {
      if (state.finishAt === null || context.now >= state.finishAt) return state;
      if (hasSubmitted(state.submissionsByPlayer, input.playerId)) return state;
      let value: string;
      if (state.round.kind === "pick" && input.type === "blickwinkel:pick") {
        if (!isKnownPlayer(context, input.targetPlayerId) ||
          (context.players.length > 1 && input.targetPlayerId === input.playerId)) return state;
        value = input.targetPlayerId;
      } else if (state.round.kind === "text" && input.type === "blickwinkel:text") {
        if (typeof input.text !== "string" || input.text.length > 4000) return state;
        value = input.text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
        if (value.length < 2 || [...value].length > 180) return state;
      } else if ((state.round.kind === "photo" || state.round.kind === "draw") && input.type === "blickwinkel:media") {
        if (!validMedia(input.media)) return state;
        if (state.round.kind === "draw" && state.round.maxStrokes &&
          (!Number.isInteger(input.strokeCount) || !input.strokeCount || input.strokeCount < 1 ||
            input.strokeCount > state.round.maxStrokes)) return state;
        value = input.media;
      } else return state;

      const submissionsByPlayer = { ...state.submissionsByPlayer, [input.playerId]: value };
      const next = { ...state, submissionsByPlayer, submittedCount: Object.keys(submissionsByPlayer).length, updatedAt: context.now };
      return next.submittedCount >= context.players.length ? completeSubmit(next, context) : next;
    }

    if (state.stage === "vote" && input.type === "blickwinkel:ballot") {
      if (hasSubmitted(state.ballotsByPlayer, input.playerId) ||
          !state.entries.some((entry) => entry.id === input.entryId) ||
          state.entryOwnerById[input.entryId] === input.playerId) return state;
      const ballotsByPlayer = { ...state.ballotsByPlayer, [input.playerId]: input.entryId };
      const next = { ...state, ballotsByPlayer, submittedCount: Object.keys(ballotsByPlayer).length, updatedAt: context.now };
      const eligibleCount = context.players.filter(({ id }) =>
        state.entries.some((entry) => state.entryOwnerById[entry.id] !== id)).length;
      return next.submittedCount >= eligibleCount ? revealCreative(next, context) : next;
    }
    return state;
  },

  tick(state, _deltaMs, context) {
    if (state.phase !== "playing" || state.finishAt === null || context.now < state.finishAt) return state;
    if (state.stage === "submit") return completeSubmit(state, context);
    if (state.stage === "showcase") {
      if (state.showcaseIndex + 1 < state.entries.length) {
        return stageState({ ...state, showcaseIndex: state.showcaseIndex + 1 }, "showcase", context, showcaseMs);
      }
      if (state.round?.kind === "pick" || state.entries.length === 0) {
        return stageState(state, "gallery", context, galleryMs);
      }
      if (state.entries.length === 1) return revealCreative(state, context);
      return stageState({ ...state, submittedCount: 0 }, "vote", context, null);
    }
    if (state.stage === "gallery") {
      if (state.round?.kind === "pick") return stageState(state, "scoreboard", context, scoreboardMs);
      if (state.entries.length <= 1) return revealCreative(state, context);
      return stageState({ ...state, submittedCount: 0 }, "vote", context, null);
    }
    if (state.stage === "scoreboard") {
      if (state.roundIndex + 1 >= state.rounds.length) {
        return transitionRoundState({
          ...state,
          stage: "finished",
          finishAt: null,
          message: context.language === "en" ? "The group has spoken!" : "Die Gruppe hat entschieden!"
        }, "locked", context.now, {
          durationMs: roundPhaseDurations.lockedMs,
          message: context.language === "en" ? "The group has spoken!" : "Die Gruppe hat entschieden!"
        });
      }
      return stageState(state, "countdown", context, countdownMs);
    }
    if (state.stage !== "countdown") return state;

    const nextIndex = state.roundIndex + 1;
    const round = state.rounds[nextIndex]!;
    return stageState({
      ...state,
      roundIndex: nextIndex,
      round,
      submissionsByPlayer: {},
      ballotsByPlayer: {},
      entryOwnerById: {},
      entries: [],
      submittedCount: 0,
      roundScores: {},
      winnerIds: [],
      avatarTargetByPlayer: avatarTargets(round, context.players),
      showcaseIndex: 0,
      message: context.language === "en" ? "Next task!" : "Die nächste Aufgabe wartet!"
    }, "submit", context, submitMs[round.kind]);
  },

  isRoundFinished(state) {
    return state.phase === "locked";
  },

  buildScore(state): ScoreEntry[] {
    return Object.entries(state.totals)
      .filter(([, delta]) => delta > 0)
      .map(([playerId, delta]) => ({ playerId, delta, reason: "Blickwinkel" }));
  },

  toPublicState(state, context) {
    return toPublic(state, context);
  },

  toControllerStateForPlayer(state, context, playerId): BlickwinkelControllerState {
    const selectedId = state.round?.kind === "pick"
      ? state.submissionsByPlayer[playerId]
      : state.ballotsByPlayer[playerId];
    return {
      ...toPublic(state, context),
      entries: state.entries.map(({ id, label, authorId, authorName }) => ({ id, label, authorId, authorName })),
      hasSubmitted: state.stage === "avatar"
        ? hasSubmitted(state.avatarsByPlayer, playerId)
        : state.stage === "submit"
        ? hasSubmitted(state.submissionsByPlayer, playerId)
        : hasSubmitted(state.ballotsByPlayer, playerId),
      selectedId,
      ownEntryId: Object.keys(state.entryOwnerById).find((id) => state.entryOwnerById[id] === playerId),
      basePhoto: state.round?.useOtherAvatar || state.round?.useOwnAvatar
        ? state.avatarsByPlayer[state.avatarTargetByPlayer[playerId] ?? ""]
        : undefined
    };
  }
};
