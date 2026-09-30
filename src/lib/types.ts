export type DeckType = "fibonacci" | "tshirt";

export type Player = {
  id: string;
  name: string;
  avatar: { type: "emoji" | "gif"; value: string };
  isHost: boolean;
  connected: boolean;
  vote: string | null;
  /** cleared on new round. */
  roast: string | null;
};

export type Story = {
  title: string;
  description: string;
};

export type RevealBurstMood = "consensus" | "split" | "chaos";

export type ReactionShowEvent = {
  id: string;
  fromPlayerId: string;
  fromName: string;
  targetPlayerId: string | null;
  emoji: string;
  createdAt: number;
};

export type RevealBurstEvent = {
  id: string;
  mood: RevealBurstMood;
  emojis: string[];
};

export type RoomState = {
  code: string;
  deck: DeckType;
  hostId: string;
  players: Map<string, Player>;
  playerTokens: Map<string, string>;
  story: Story | null;
  revealed: boolean;
  lastActivityAt: number;
};

export type RoomSecrets = {
  hostToken: string;
};

export type ClientPlayer = Omit<Player, never> & { hasVoted: boolean };

export type ClientRoomSnapshot = {
  code: string;
  deck: DeckType;
  hostId: string;
  players: Array<{
    id: string;
    name: string;
    avatar: Player["avatar"];
    isHost: boolean;
    connected: boolean;
    hasVoted: boolean;
    vote: string | null;
    roast: string | null;
  }>;
  story: Story | null;
  revealed: boolean;
  deckCards: string[];
};
