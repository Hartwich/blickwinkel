import type { BaseRoundState, PlayerInput } from "@open-party-lab/game-core";

export type BlickwinkelTaskKind = "pick" | "text" | "photo" | "draw";

export interface BlickwinkelRound {
  id: string;
  kind: BlickwinkelTaskKind;
  category: string;
  prompt: string;
}

interface BlickwinkelTaskInput extends PlayerInput {
  roundId: string;
  roundIndex: number;
  runNumber: number;
}

export interface BlickwinkelPickInput extends BlickwinkelTaskInput {
  type: "blickwinkel:pick";
  targetPlayerId: string;
}

export interface BlickwinkelTextInput extends BlickwinkelTaskInput {
  type: "blickwinkel:text";
  text: string;
}

export interface BlickwinkelMediaInput extends BlickwinkelTaskInput {
  type: "blickwinkel:media";
  media: string;
}

export interface BlickwinkelBallotInput extends BlickwinkelTaskInput {
  type: "blickwinkel:ballot";
  entryId: string;
}

export type BlickwinkelInput = BlickwinkelPickInput | BlickwinkelTextInput | BlickwinkelMediaInput | BlickwinkelBallotInput;

export interface BlickwinkelEntry {
  id: string;
  label: string;
  text?: string;
  media?: string;
  votes?: number;
  authorName?: string;
}

export interface BlickwinkelState extends BaseRoundState {
  stage: "submit" | "vote" | "reveal" | "finished";
  rounds: BlickwinkelRound[];
  roundIndex: number;
  round: BlickwinkelRound | null;
  finishAt: number | null;
  submissionsByPlayer: Record<string, string>;
  ballotsByPlayer: Record<string, string>;
  entryOwnerById: Record<string, string>;
  entries: BlickwinkelEntry[];
  submittedCount: number;
  totals: Record<string, number>;
  roundScores: Record<string, number>;
  winnerIds: string[];
}

export interface BlickwinkelPublicState
  extends Omit<BlickwinkelState, "submissionsByPlayer" | "ballotsByPlayer" | "entryOwnerById"> {
  playerNames: Array<{ id: string; name: string }>;
}

export interface BlickwinkelControllerState extends BlickwinkelPublicState {
  hasSubmitted: boolean;
  selectedId?: string;
  ownEntryId?: string;
}
