import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/security/rateLimit";

describe("rateLimit", () => {
  it("permite hasta el límite y luego bloquea", () => {
    const key = `test-${Math.random()}`;
    const opts = { limit: 2, windowMs: 10_000 };
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(true);
    const third = rateLimit(key, opts);
    expect(third.ok).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("reinicia tras la ventana", async () => {
    const key = `test-${Math.random()}`;
    const opts = { limit: 1, windowMs: 20 };
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 30));
    expect(rateLimit(key, opts).ok).toBe(true);
  });
});
