import { describe, expect, it } from "vitest";

import { rpcTarget } from "./rpc-target";

const API = "http://api.internal:3001";

describe("rpcTarget", () => {
  it("construit l'URL /rpc/* et garde la query", () => {
    expect(rpcTarget(["system", "health", "get"], "?data=1", API)?.href).toBe(
      "http://api.internal:3001/rpc/system/health/get?data=1",
    );
  });

  it.each([[[".."]], [["..", "metrics"]], [["system", "..", "..", "x"]], [["."]], [[]]])(
    "refuse %j (sortie du préfixe /rpc)",
    (path) => {
      expect(rpcTarget(path, "", API)).toBeNull();
    },
  );

  it("ré-encode un « / » décodé dans un segment", () => {
    expect(rpcTarget(["a/../../x"], "", API)?.pathname).toBe("/rpc/a%2F..%2F..%2Fx");
  });

  it("ignore le chemin éventuel de l'origine configurée", () => {
    expect(rpcTarget(["x"], "", "http://api.internal:3001/base/")?.pathname).toBe("/rpc/x");
  });
});
