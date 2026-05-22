import { z } from "zod";
import type { Pool } from "./types";

const ORCA_POOLS_URL = "https://api.orca.so/v2/solana/pools";
const PAGE_SIZE = 100;
const MAX_PAGES = 30;

const tokenSchema = z.object({
  symbol: z.string(),
  decimals: z.coerce.number(),
});

const statsWindowSchema = z.object({
  volume: z.coerce.number(),
  fees: z.coerce.number(),
  yieldOverTvl: z.coerce.number(),
});

const poolSchema = z.object({
  address: z.string(),
  tvlUsdc: z.coerce.number(),
  price: z.coerce.number(),
  tickCurrentIndex: z.coerce.number(),
  tickSpacing: z.coerce.number(),
  feeRate: z.coerce.number(),
  tokenMintA: z.string(),
  tokenMintB: z.string(),
  tokenA: tokenSchema,
  tokenB: tokenSchema,
  stats: z.object({ "24h": statsWindowSchema, "7d": statsWindowSchema }),
  priceHistory7d: z.array(z.coerce.number()).catch([]).default([]),
});

const responseSchema = z.object({
  data: z.array(z.unknown()),
  meta: z
    .object({
      cursor: z.object({ next: z.string().nullish() }).nullish(),
    })
    .nullish(),
});

// Valida e normaliza um pool cru da API da Orca para o tipo de domínio.
export function mapOrcaPool(raw: unknown): Pool {
  const p = poolSchema.parse(raw);
  return {
    address: p.address,
    tokenA: {
      mint: p.tokenMintA,
      symbol: p.tokenA.symbol,
      decimals: p.tokenA.decimals,
    },
    tokenB: {
      mint: p.tokenMintB,
      symbol: p.tokenB.symbol,
      decimals: p.tokenB.decimals,
    },
    tvlUsd: p.tvlUsdc,
    price: p.price,
    tickCurrentIndex: p.tickCurrentIndex,
    tickSpacing: p.tickSpacing,
    feeRate: p.feeRate / 1_000_000, // millionésimos → fração
    volume24hUsd: p.stats["24h"].volume,
    volume7dUsd: p.stats["7d"].volume,
    fees24hUsd: p.stats["24h"].fees,
    yieldOverTvl24h: p.stats["24h"].yieldOverTvl,
    priceHistory7d: p.priceHistory7d,
  };
}

// Busca todos os pools de Solana da Orca, paginando pelo cursor.
// Pools cujo formato não validar são ignorados (a API pode evoluir).
export async function fetchOrcaPools(): Promise<Pool[]> {
  const pools: Pool[] = [];
  let after: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(ORCA_POOLS_URL);
    url.searchParams.set("limit", String(PAGE_SIZE));
    if (after) url.searchParams.set("after", after);

    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Orca API respondeu ${res.status}`);

    const { data, meta } = responseSchema.parse(await res.json());
    for (const raw of data) {
      try {
        pools.push(mapOrcaPool(raw));
      } catch {
        // pool com formato inesperado — ignora
      }
    }

    after = meta?.cursor?.next ?? undefined;
    if (!after || data.length === 0) break;
  }

  return pools;
}
