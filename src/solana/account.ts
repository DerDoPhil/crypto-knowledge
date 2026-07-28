import { jsonRpc } from "../core/rpc.js";

/** Fetch a Solana account's raw data via getAccountInfo (base64), or null if it doesn't exist. */
export async function getAccountDataBase64(urls: string | string[], pubkeyBase58: string): Promise<Buffer | null> {
  const res = await jsonRpc<{ value: { data: [string, string] } | null }>(urls, "getAccountInfo", [
    pubkeyBase58,
    { encoding: "base64", commitment: "confirmed" },
  ]);
  if (!res.value) return null;
  return Buffer.from(res.value.data[0], "base64");
}
