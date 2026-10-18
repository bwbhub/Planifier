import { describe, expect, it } from "vitest";

import { readLimitedBody } from "./limited-body";

function streamOf(...chunks: number[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const size of chunks) controller.enqueue(new Uint8Array(size).fill(1));
      controller.close();
    },
  });
}

describe("readLimitedBody", () => {
  it("rend le corps assemblé sous la limite", async () => {
    const body = await readLimitedBody(streamOf(3, 4), 10);
    expect(body?.byteLength).toBe(7);
  });

  it("accepte un corps égal à la limite", async () => {
    expect((await readLimitedBody(streamOf(5, 5), 10))?.byteLength).toBe(10);
  });

  it("rend null au-delà de la limite", async () => {
    await expect(readLimitedBody(streamOf(6, 6), 10)).resolves.toBeNull();
  });

  it("rend un corps vide sans flux", async () => {
    expect((await readLimitedBody(null, 10))?.byteLength).toBe(0);
  });
});
