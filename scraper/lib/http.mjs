import config from '../config.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;

/** GET con pausa tra le richieste (per non pesare sui siti delle fonti) e 2 tentativi. */
export async function get(url, { as = 'text', retries = 2 } = {}) {
  const wait = last + config.http.delayMs - Date.now();
  if (wait > 0) await sleep(wait);
  for (let attempt = 0; ; attempt++) {
    last = Date.now();
    try {
      const res = await fetch(url, { headers: { 'User-Agent': config.http.userAgent, Accept: '*/*' } });
      if (!res.ok) throw new Error(`HTTP ${res.status} su ${url}`);
      if (as === 'json') return await res.json();
      if (as === 'buffer') return new Uint8Array(await res.arrayBuffer());
      return await res.text();
    } catch (e) {
      if (attempt >= retries) throw e;
      await sleep(1500 * (attempt + 1));
    }
  }
}

export function qs(params) {
  return new URLSearchParams(params).toString();
}
