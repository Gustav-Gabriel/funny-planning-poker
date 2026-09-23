export type DeckType = "fibonacci" | "tshirt";

export type Player = {
  id: string;
  name: string;
  avatar: { type: "emoji" | "gif"; value: string };
  isHost: boolean;
  connected: boolean;
  vote: string | null;
};

export type Story = {
  title: string;
  description: string;
};

export type RoomState = {
  code: string;
  name: string;
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
  name: string;
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
  }>;
  story: Story | null;
  revealed: boolean;
  deckCards: string[];
};
