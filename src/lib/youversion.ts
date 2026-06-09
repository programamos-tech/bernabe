const YVP_API_BASE = "https://api.youversion.com/v1";

/** Preferida: Nueva Traducción Viviente (requiere licencia en platform.youversion.com) */
export const YVP_NTV_BIBLE_ID = Number(process.env.YVP_NTV_BIBLE_ID ?? 127);
/** Respaldo si NTV no está licenciada en tu App Key */
export const YVP_BIBLE_FALLBACK_ID = Number(process.env.YVP_BIBLE_FALLBACK_ID ?? 147);

export type VersiculoDelDia = {
  reference: string;
  content: string;
  copyright: string | null;
  passageId: string;
  version: string;
  versionTitle: string;
  bibleId: number;
  dayOfYear: number;
  usedFallback: boolean;
};

type YvpVotdResponse = {
  day?: number;
  passage_id?: string;
};

type YvpPassageResponse = {
  content?: string;
  reference?: string;
  passage_id?: string;
};

type YvpBibleResponse = {
  copyright?: string | null;
  title?: string;
  localized_title?: string;
  abbreviation?: string;
  localized_abbreviation?: string;
};

function getAppKey(): string | null {
  return process.env.YVP_APP_KEY?.trim() || process.env.YOUVERSION_APP_KEY?.trim() || null;
}

export function dayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

async function yvpFetch<T>(path: string): Promise<T> {
  const appKey = getAppKey();
  if (!appKey) {
    throw new Error("YVP_APP_KEY no configurada");
  }

  const res = await fetch(`${YVP_API_BASE}${path}`, {
    headers: { "X-YVP-App-Key": appKey },
    next: { revalidate: 60 * 60 * 6 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`YouVersion API ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

function cleanPassageText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\d+\s*/, "")
    .trim();
}

async function fetchPassageForBible(
  bibleId: number,
  passageId: string,
): Promise<{ passage: YvpPassageResponse; bible: YvpBibleResponse }> {
  const encodedPassage = encodeURIComponent(passageId);
  const [passage, bible] = await Promise.all([
    yvpFetch<YvpPassageResponse>(`/bibles/${bibleId}/passages/${encodedPassage}?format=text`),
    yvpFetch<YvpBibleResponse>(`/bibles/${bibleId}`),
  ]);
  return { passage, bible };
}

export async function fetchVersiculoDelDiaNTV(date = new Date()): Promise<VersiculoDelDia> {
  const day = dayOfYear(date);

  const votd = await yvpFetch<YvpVotdResponse>(`/verse_of_the_days/${day}`);
  const passageId = votd.passage_id;
  if (!passageId) {
    throw new Error("YouVersion no devolvió passage_id para el versículo del día");
  }

  const candidates = [YVP_NTV_BIBLE_ID, YVP_BIBLE_FALLBACK_ID].filter(
    (id, i, arr) => Number.isFinite(id) && arr.indexOf(id) === i,
  );

  let lastError: Error | null = null;
  for (let i = 0; i < candidates.length; i++) {
    const bibleId = candidates[i];
    try {
      const { passage, bible } = await fetchPassageForBible(bibleId, passageId);
      const content = passage.content ? cleanPassageText(passage.content) : "";
      if (!content) {
        throw new Error("Pasaje vacío");
      }

      const version = bible.localized_abbreviation ?? bible.abbreviation ?? "Biblia";
      const versionTitle = bible.localized_title ?? bible.title ?? version;

      return {
        reference: passage.reference?.trim() || passageId.replace(/\./g, " ").trim(),
        content,
        copyright: bible.copyright?.trim() || null,
        passageId,
        version,
        versionTitle,
        bibleId,
        dayOfYear: day,
        usedFallback: i > 0,
      };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError ?? new Error("No se pudo obtener el versículo en español");
}

export function bibleComUrl(bibleId: number, passageId: string, versionAbbr: string): string {
  const suffix = versionAbbr.replace(/\s+/g, "");
  return `https://www.bible.com/bible/${bibleId}/${passageId}.${suffix}`;
}
