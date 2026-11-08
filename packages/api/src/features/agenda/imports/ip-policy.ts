import { BlockList, isIP } from "node:net";

/** Plages qui ne sont pas des adresses publiques : lecture d'un flux vers elles refusée (SSRF). */
const NON_PUBLIC = new BlockList();
const V4_RANGES: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];
const V6_RANGES: [string, number][] = [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96],
  ["100::", 64],
  ["2001::", 32],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["fc00::", 7],
  ["fe80::", 10],
  ["fec0::", 10],
  ["ff00::", 8],
];
for (const [network, prefix] of V4_RANGES) NON_PUBLIC.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of V6_RANGES) NON_PUBLIC.addSubnet(network, prefix, "ipv6");

/** `::ffff:10.0.0.1` ⇒ `10.0.0.1` ; sinon `null`. */
function mappedIpv4(address: string): string | null {
  const match = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(address);
  return match?.[1] ?? null;
}

/**
 * Cette adresse IP est-elle publique (joignable depuis Internet) ? Refuse boucle locale, réseaux privés, lien local
 * (dont les métadonnées cloud 169.254.169.254), partage CGNAT, multicast, documentation, et les adresses IPv4 écrites en
 * IPv6 (`::ffff:`). Une chaîne qui n'est pas une adresse est refusée.
 */
export function isPublicAddress(address: string): boolean {
  const mapped = mappedIpv4(address);
  if (mapped !== null) return isPublicAddress(mapped);
  const family = isIP(address);
  if (family === 0) return false;
  return !NON_PUBLIC.check(address, family === 4 ? "ipv4" : "ipv6");
}
