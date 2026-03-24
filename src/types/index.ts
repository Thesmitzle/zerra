export interface EncryptedMessage {
  id: string;
  encryptedData: string;
  iv: string;
  selfDestructMs: number;
  senderId: string;
  senderName: string;
  timestamp: number;
}

export interface DecryptedMessage extends EncryptedMessage {
  plaintext: string;
  isOwn: boolean;
  destructAt?: number;
  destroyed?: boolean;
}

export type SelfDestructOption = {
  label: string;
  value: number;
};

export const SELF_DESTRUCT_OPTIONS: SelfDestructOption[] = [
  { label: "Never", value: 0 },
  { label: "10 sec", value: 10_000 },
  { label: "1 min", value: 60_000 },
  { label: "5 min", value: 5 * 60_000 },
  { label: "1 hour", value: 60 * 60_000 },
];

export type RoomExpiry = "30m" | "1h" | "24h";

export interface RoomMeta {
  roomId: string;
  expiresAt: number;
  participantCount: number;
}

export interface TypingState {
  name: string;
  isTyping: boolean;
}