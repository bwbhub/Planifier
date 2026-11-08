import { describe, expect, it } from "vitest";

import { isPublicAddress } from "./ip-policy";

describe("isPublicAddress", () => {
  it.each([
    "8.8.8.8",
    "142.250.74.14",
    "1.1.1.1",
    "172.32.0.1",
    "2606:4700:4700::1111",
    "2a00:1450:4007:80d::200e",
  ])("accepte l'adresse publique %s", (address) => {
    expect(isPublicAddress(address)).toBe(true);
  });

  it.each([
    "127.0.0.1",
    "127.255.255.254",
    "0.0.0.0",
    "10.0.0.5",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "192.0.2.10",
    "198.18.0.1",
    "224.0.0.1",
    "255.255.255.255",
    "::",
    "::1",
    "fe80::1",
    "fc00::1",
    "fd12:3456::1",
    "ff02::1",
    "2001:db8::1",
    "64:ff9b::808:808",
    "2002:c0a8:101::1",
    "::ffff:127.0.0.1",
    "::ffff:10.0.0.1",
    "::ffff:169.254.169.254",
    "::127.0.0.1",
    "::7f00:1",
    "::2",
    "::ffff:7f00:1",
    "::ffff:0:127.0.0.1",
    "64:ff9b:1::1",
    "2001::1",
    "3fff::1",
    "fe80::1%eth0",
    "192.31.196.1",
  ])("refuse l'adresse non publique %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  it.each(["", "localhost", "999.1.1.1", "1.2.3", "0x7f.0.0.1", "2130706433", "::ffff:zz"])(
    "refuse ce qui n'est pas une adresse : %j",
    (value) => {
      expect(isPublicAddress(value)).toBe(false);
    },
  );
});
