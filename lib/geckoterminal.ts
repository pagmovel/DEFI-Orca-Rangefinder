// Cliente da GeckoTerminal para OHLCV horário de pools — usado apenas
// server-side (a API não envia cabeçalhos CORS). Falhas degradam para [].

const GECKO_BASE = "https://api.geckoterminal.com/api/v2/networks/solana/pools";
const HOURS_7D = 168;

// Extrai os preços de fechamento (índice 4) em ordem cronológica.
// ohlcv_list: [[timestamp, open, high, low, close, volume], ...].
export function extractCloses(raw: unknown): number[] {
  const list = (raw as { data?: { attributes?: { ohlcv_list?: unknown } } })
    ?.data?.attributes?.ohlcv_list;
  if (!Array.isArray(list)) return [];

  return list
    .filter(
      (e): e is number[] =>
        Array.isArray(e) && e.length >= 5 && typeof e[4] === "number",
    )
    .slice()
    .sort((a, b) => a[0] - b[0])
    .map((e) => e[4]);
}

// Busca os fechamentos horários dos últimos 7 dias para um pool.
// Retorna [] em qualquer erro para o chamador poder usar fallback.
export async function fetchGeckoOhlcv(poolAddress: string): Promise<number[]> {
  try {
    const url = `${GECKO_BASE}/${poolAddress}/ohlcv/hour?limit=${HOURS_7D}`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    return extractCloses(await res.json());
  } catch {
    return [];
  }
}
