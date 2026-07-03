import { describe, expect, it } from "vitest";
import { resolveRoom } from "../src/rooms";

describe("resolveRoom", () => {
  it("maps ids and aliases to a canonical room", () => {
    expect(resolveRoom("work1")).toBe("work1");
    expect(resolveRoom("WR2")).toBe("work2");
    expect(resolveRoom("Work Room 1")).toBe("work1");
    expect(resolveRoom("  drawing ")).toBe("drawing");
  });

  it("returns null for unknown rooms", () => {
    expect(resolveRoom("kitchen")).toBeNull();
  });
});
