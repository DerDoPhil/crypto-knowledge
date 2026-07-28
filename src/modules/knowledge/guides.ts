/**
 * Curated, ready-to-retrieve Web3 how-to knowledge. Step-by-step runbooks with
 * REAL commands so an agent can execute them without burning reasoning/search
 * credits re-deriving well-known procedures. Each guide is verified against the
 * current tooling (Foundry, Solana/Anza CLI, Anchor) as of 2026-06.
 *
 * The actual guide bodies live in a PRIVATE repo (DerDoPhil/crypto-knowledge-content)
 * and are fetched here at cold-start via the GitHub Contents API — this repo stays
 * open-source (server framework, search/ranking logic, reference tables) while the
 * paid content itself is no longer readable for free on GitHub.
 */
import { fetchJson } from "../../core/http.js";

export interface GuideStep {
  title: string;
  command?: string;
  note?: string;
}

export interface Guide {
  topic: string;
  title: string;
  summary: string;
  /** Which chains this applies to: chain keys, or "evm" / "solana" / "all". */
  scope: string[];
  prerequisites: string[];
  steps: GuideStep[];
  warnings?: string[];
  references?: string[];
}

const CONTENT_REPO_URL = "https://api.github.com/repos/DerDoPhil/crypto-knowledge-content/contents/guides.json";

async function fetchGuidesFromPrivateRepo(): Promise<Record<string, Guide>> {
  const token = process.env.GITHUB_CONTENT_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_CONTENT_TOKEN is not set — guide content cannot load. This token must have read-only Contents access to the private DerDoPhil/crypto-knowledge-content repo.",
    );
  }
  return fetchJson<Record<string, Guide>>(CONTENT_REPO_URL, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github.raw+json",
    },
  });
}

export const GUIDES: Record<string, Guide> = await fetchGuidesFromPrivateRepo();

export const GUIDE_TOPICS = Object.keys(GUIDES);
