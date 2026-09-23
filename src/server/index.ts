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
  "pick", "text", "pick", "photo", "pick", "draw", "text", "pick", "photo", "draw"
];
const submitMs: Record<BlickwinkelTaskKind, number> = {
  pick: 25_000,
  text: 70_000,
  photo: 90_000,
  draw: 120_000
};
const voteMs = 25_000;
const revealMs = 5_000;
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
  const pools: Record<BlickwinkelTaskKind, BlickwinkelRound[]> = {
    pick: shuffle(getBlickwinkelQuestions(context.language), seed),
    text: shuffle(getCreativeTasks(context.language).filter((task) => task.kind === "text"), seed + 1),
    photo: shuffle(getCreativeTasks(context.language).filter((task) => task.kind === "photo"), seed + 2),
    draw: shuffle(getCreativeTasks(context.language).filter((task) => task.kind === "draw"), seed + 3)
  };
  return roundKinds.map((kind) => pools[kind].shift()).filter((round): round is BlickwinkelRound => Boolean(round));
}

function isKnownPlayer(context: ServerGameContext, playerId: string): boolean {
  return context.players.some((player) => player.id === playerId);
}

function hasSubmitted(record: Record<string, string>, playerId: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, playerId);
}

function stageState(state: BlickwinkelState, stage: BlickwinkelState["stage"], context: ServerGameContext, durationMs: number): BlickwinkelState {
  return {
    ...state,
    stage,
    finishAt: context.now + durationMs,
    phaseStartedAt: context.now,
    phaseEndsAt: context.now + durationMs,
    updatedAt: context.now
  };
}

function reveal(
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
    message: context.language === "en" ? "Here is what the group decided." : "So hat die Gruppe entschieden."
  }, "reveal", context, revealMs);
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
  const entries = context.players
    .map(({ id, name }) => ({ id, label: name, votes: counts[id] ?? 0 }))
    .sort((a, b) => b.votes - a.votes || a.label.localeCompare(b.label));
  return reveal(state, context, entries, winnerIds, deltas);
}

function prepareCreativeVote(state: BlickwinkelState, context: ServerGameContext): BlickwinkelState {
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
      ...(state.round?.kind === "text" ? { text: content } : { media: content })
    };
  });
  const next: BlickwinkelState = {
    ...state,
    entries,
    entryOwnerById: ownerById,
    ballotsByPlayer: {},
    submittedCount: 0,
    message: context.language === "en" ? "Vote for your favourite entry. Authors stay hidden until the reveal." : "Stimmt für euren Favoriten. Die Namen bleiben bis zur Auflösung geheim."
  };
  if (entries.length > 1) return stageState(next, "vote", context, voteMs);
  return revealCreative(next, context);
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
  return reveal(state, context, entries, winnerIds, deltas);
}

function completeSubmit(state: BlickwinkelState, context: ServerGameContext): BlickwinkelState {
  return state.round?.kind === "pick" ? revealPick(state, context) : prepareCreativeVote(state, context);
}

function toPublic(state: BlickwinkelState, context: ServerGameContext): BlickwinkelPublicState {
  const {
    submissionsByPlayer: _submissions,
    ballotsByPlayer: _ballots,
    entryOwnerById: _owners,
    ...publicState
  } = state;
  const rounds = state.rounds.map((round, index) => index <= state.roundIndex ? round : { ...round, prompt: "" });
  return {
    ...publicState,
    rounds,
    finishAt: state.finishAt === null ? null : Date.now() + Math.max(0, state.finishAt - context.now),
    entries: state.stage === "submit" ? [] : state.entries,
    playerNames: context.players.map(({ id, name }) => ({ id, name }))
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
      stage: "submit",
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
      winnerIds: []
    };
  },

  startRound(state, context) {
    const rounds = chooseRounds(context);
    const round = rounds[0] ?? null;
    return transitionRoundState({
      ...state,
      stage: "submit",
      rounds,
      roundIndex: 0,
      round,
      finishAt: round ? context.now + submitMs[round.kind] : null,
      submissionsByPlayer: {},
      ballotsByPlayer: {},
      entryOwnerById: {},
      entries: [],
      submittedCount: 0,
      totals: Object.fromEntries(context.players.map(({ id }) => [id, 0])),
      roundScores: {},
      winnerIds: []
    }, "playing", context.now, {
      startedAt: context.now,
      message: context.language === "en" ? "Look at the prompt on your phone." : "Seht euch die Aufgabe auf dem Handy an."
    });
  },

  handleInput(state, input, context) {
    if (state.phase !== "playing" || !state.round || !input || typeof input !== "object" ||
        input.roundId !== state.round.id || input.roundIndex !== state.roundIndex ||
        input.runNumber !== context.roundNumber || !isKnownPlayer(context, input.playerId) ||
        state.finishAt === null || context.now >= state.finishAt) return state;

    if (state.stage === "submit") {
      if (hasSubmitted(state.submissionsByPlayer, input.playerId)) return state;
      let value: string;
      if (state.round.kind === "pick" && input.type === "blickwinkel:pick") {
        if (!isKnownPlayer(context, input.targetPlayerId) || input.targetPlayerId === input.playerId) return state;
        value = input.targetPlayerId;
      } else if (state.round.kind === "text" && input.type === "blickwinkel:text") {
        if (typeof input.text !== "string" || input.text.length > 4000) return state;
        value = input.text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
        if (value.length < 2 || [...value].length > 180) return state;
      } else if ((state.round.kind === "photo" || state.round.kind === "draw") && input.type === "blickwinkel:media") {
        if (!validMedia(input.media)) return state;
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
    if (state.stage === "vote") return revealCreative(state, context);
    if (state.stage !== "reveal") return state;

    const nextIndex = state.roundIndex + 1;
    if (nextIndex >= state.rounds.length) {
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
      hasSubmitted: state.stage === "submit"
        ? hasSubmitted(state.submissionsByPlayer, playerId)
        : hasSubmitted(state.ballotsByPlayer, playerId),
      selectedId,
      ownEntryId: Object.keys(state.entryOwnerById).find((id) => state.entryOwnerById[id] === playerId)
    };
  }
};
