import { NextResponse } from "next/server";
import { bibleComUrl, fetchVersiculoDelDiaNTV } from "@/lib/youversion";

export const revalidate = 3600;

export async function GET() {
  try {
    const versiculo = await fetchVersiculoDelDiaNTV();
    return NextResponse.json({
      ...versiculo,
      url: bibleComUrl(versiculo.bibleId, versiculo.passageId, versiculo.version),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al obtener el versículo";
    const configured = Boolean(process.env.YVP_APP_KEY || process.env.YOUVERSION_APP_KEY);
    return NextResponse.json(
      {
        error: message,
        configured,
      },
      { status: configured ? 502 : 503 },
    );
  }
}
