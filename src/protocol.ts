import type { BaseRoundState, PlayerInput } from "@open-party-lab/game-core";

export type BlickwinkelTaskKind = "pick" | "text" | "photo" | "draw";

export interface BlickwinkelRound {
  id: string;
  kind: BlickwinkelTaskKind;
  category: string;
  prompt: string;
  maxStrokes?: 1 | 2;
  useOtherAvatar?: boolean;
  useOwnAvatar?: boolean;
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
  strokeCount?: number;
}

export interface BlickwinkelBallotInput extends BlickwinkelTaskInput {
  type: "blickwinkel:ballot";
  entryId: string;
}

export interface BlickwinkelAvatarInput extends PlayerInput {
  type: "blickwinkel:avatar";
  runNumber: number;
  media: string;
}

export type BlickwinkelInput = BlickwinkelPickInput | BlickwinkelTextInput | BlickwinkelMediaInput | BlickwinkelBallotInput | BlickwinkelAvatarInput;

export interface BlickwinkelEntry {
  id: string;
  label: string;
  text?: string;
  media?: string;
  votes?: number;
  authorName?: string;
  authorId?: string;
}

export interface BlickwinkelState extends BaseRoundState {
  stage: "avatar" | "submit" | "showcase" | "gallery" | "vote" | "scoreboard" | "countdown" | "finished";
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
  avatarsByPlayer: Record<string, string>;
  avatarTargetByPlayer: Record<string, string>;
  showcaseIndex: number;
}

export interface BlickwinkelPublicState
  extends Omit<BlickwinkelState, "submissionsByPlayer" | "ballotsByPlayer" | "entryOwnerById" | "avatarsByPlayer" | "avatarTargetByPlayer"> {
  playerNames: Array<{ id: string; name: string; avatar?: string }>;
}

export interface BlickwinkelControllerState extends BlickwinkelPublicState {
  hasSubmitted: boolean;
  selectedId?: string;
  ownEntryId?: string;
  basePhoto?: string;
}
