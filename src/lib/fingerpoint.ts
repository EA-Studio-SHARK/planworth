import { generateChallenges } from "../vendor/fingerpoint/challenge-browser.js";
import { decodeDetector } from "../vendor/fingerpoint/detector-codec";
import { parseNumbers } from "../vendor/fingerpoint/fingerprint-core.js";
import {
  analyzeSharedOutputs,
  type SharedDetector,
} from "../vendor/fingerpoint/shared-detector";
import type { Analysis, Bank, BankModel, Challenge, Output } from "../vendor/fingerpoint/types";

const BASE = `${import.meta.env.BASE_URL}fingerpoint/`;

type SlimModel = {
  id: string;
  display_name: string;
  family: string;
  family_name: string;
  response_count: number;
};

type SlimBank = { built_at: string; models: SlimModel[] };

export type FingerpointEngine = { detector: SharedDetector; bank: Bank };

let loading: Promise<FingerpointEngine> | undefined;

async function readBytes(url: string, onProgress?: (loaded: number, total: number) => void) {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`failed to load ${url}`);
  const total = Number(res.headers.get("content-length") || 0);
  if (!res.body) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress?.(loaded, total || loaded);
  }
  const out = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function asBank(slim: SlimBank, detector: SharedDetector): Bank {
  const byId = new Map(slim.models.map((model) => [model.id, model]));
  const models: BankModel[] = detector.model_ids.map((id, index) => {
    const src = byId.get(id);
    if (!src) throw new Error(`missing model ${id}`);
    const count = Number(detector.response_counts[index] ?? src.response_count);
    return {
      id,
      display_name: src.display_name,
      family: src.family,
      family_name: src.family_name,
      response_count: count,
      valid_number_count: count,
      counts: [],
      sources: {},
      conditions: {},
    };
  });
  return {
    schema: "slim-v1",
    built_at: detector.bank_built_at,
    models,
    sources: {},
    robust: {},
    calibration: {},
  };
}

export function loadFingerpoint(onProgress?: (loaded: number, total: number) => void) {
  if (!loading) {
    loading = Promise.all([
      readBytes(`${BASE}shared_detector.bin`, onProgress),
      fetch(`${BASE}models.json`).then(async (res) => {
        if (!res.ok) throw new Error("failed to load models.json");
        return res.json() as Promise<SlimBank>;
      }),
    ])
      .then(([bytes, slim]) => {
        const detector = decodeDetector(bytes);
        return { detector, bank: asBank(slim, detector) };
      })
      .catch((error) => {
        loading = undefined;
        throw error;
      });
  }
  return loading;
}

export function newChallenges(): Challenge[] {
  return generateChallenges(3);
}

export function analyzeFingerprints(outputs: Output[], engine: FingerpointEngine): Analysis {
  return analyzeSharedOutputs(outputs, engine.bank, engine.detector, { allowPartial: true });
}

export { parseNumbers };
export type { Analysis, Challenge };
