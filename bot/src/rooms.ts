import { ROOMS, type RoomId } from "@office/shared";

const ALIASES: Record<string, RoomId> = {
  drawing: "drawing",
  "drawing room": "drawing",
  draw: "drawing",
  work1: "work1",
  wr1: "work1",
  w1: "work1",
  "work room 1": "work1",
  work2: "work2",
  wr2: "work2",
  w2: "work2",
  "work room 2": "work2",
};

/** Resolve a user-typed room name/alias to a canonical RoomId, or null. */
export function resolveRoom(input: string): RoomId | null {
  const key = input.trim().toLowerCase();
  if (key in ALIASES) {
    return ALIASES[key]!;
  }
  const byId = ROOMS.find((room) => room.id === key);
  return byId ? byId.id : null;
}
