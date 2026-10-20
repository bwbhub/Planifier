import { describe, expect, it } from "vitest";

import { API_PREFIXES, apiTarget } from "./api-target";

const API = "http://api.internal:3001";
const { rpc } = API_PREFIXES;

describe("apiTarget", () => {
  it("construit l'URL /rpc/* et garde la query", () => {
    expect(apiTarget(rpc, ["system", "health", "get"], "?data=1", API)?.href).toBe(
      "http://api.internal:3001/rpc/system/health/get?data=1",
    );
  });

  it.each([[[".."]], [["..", "metrics"]], [["system", "..", "..", "x"]], [["."]], [[]]])(
    "refuse %j (sortie du préfixe)",
    (path) => {
      expect(apiTarget(rpc, path, "", API)).toBeNull();
    },
  );

  it("ré-encode un « / » décodé dans un segment", () => {
    expect(apiTarget(rpc, ["a/../../x"], "", API)?.pathname).toBe("/rpc/a%2F..%2F..%2Fx");
  });

  it("ignore le chemin éventuel de l'origine configurée", () => {
    expect(apiTarget(rpc, ["x"], "", "http://api.internal:3001/base/")?.pathname).toBe("/rpc/x");
  });
});
