import { NextRequest, NextResponse } from "next/server";

const MAX_AUDIO_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

/** Allowed hosts for audio proxy (avoids open redirect) */
const ALLOWED_HOSTS = [
  "www.ethiopianorthodox.org",
  "ethiopianorthodox.org",
];

function isAllowedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      (u.protocol === "http:" || u.protocol === "https:") &&
      ALLOWED_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith("." + h))
    );
  } catch {
    return false;
  }
}

/** MP3 starts with ID3 (0x49 0x44 0x33) or frame sync 0xFF 0xFB/0xFA/0xF3/0xF2 */
function looksLikeMp3(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 2) return false;
  const u8 = new Uint8Array(buffer);
  if (u8[0] === 0x49 && u8[1] === 0x44 && u8[2] === 0x33) return true; // ID3
  if (u8[0] === 0xff && (u8[1] === 0xfb || u8[1] === 0xfa || u8[1] === 0xf3 || u8[1] === 0xf2))
    return true;
  return false;
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  const decodedUrl = decodeURIComponent(urlParam);
  if (!isAllowedUrl(decodedUrl)) {
    return NextResponse.json(
      { error: "URL not allowed for proxy" },
      { status: 403 }
    );
  }

  try {
    const fetchHeaders: HeadersInit = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0",
      Accept: "audio/*,*/*",
      Referer: new URL(decodedUrl).origin + "/",
    };

    const res = await fetch(decodedUrl, {
      headers: fetchHeaders,
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: res.status }
      );
    }

    const contentLengthHeader = res.headers.get("Content-Length");
    const contentLength = contentLengthHeader
      ? parseInt(contentLengthHeader, 10)
      : 0;
    if (contentLength > MAX_AUDIO_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Audio file too large" },
        { status: 413 }
      );
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_AUDIO_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Audio file too large" },
        { status: 413 }
      );
    }

    if (!looksLikeMp3(buffer)) {
      const peek = new TextDecoder("utf-8", { fatal: false }).decode(
        buffer.slice(0, 200)
      );
      console.error("[audio proxy] Upstream did not return MP3. Peek:", peek.slice(0, 80));
      return NextResponse.json(
        { error: "Upstream did not return valid MP3" },
        { status: 502 }
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", "audio/mpeg");
    headers.set("Content-Length", String(buffer.byteLength));
    headers.set("Accept-Ranges", "bytes");

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("[audio proxy] fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch audio" },
      { status: 502 }
    );
  }
}
