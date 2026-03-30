import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { parseModelStringArray } from "@/lib/ai/parseModelStringArray";
import { readFile } from "fs/promises";
import path from "path";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
const MODEL = "google/gemini-3-flash";

/** Module-level cache: local file path → { url, expiry }. Replicate files expire after 24h. */
const REPLICATE_FILE_TTL = 23 * 60 * 60 * 1000;
const replicateFileCache = new Map<string, { url: string; expiresAt: number }>();

async function toReplicateImage(url: string): Promise<string> {
  if (url.startsWith("https://")) return url;
  if (url.startsWith("http://") && !url.includes("localhost") && !url.includes("127.0.0.1")) return url;

  const localPath = url.startsWith("/") ? url : `/${url}`;
  const filePath = path.join(process.cwd(), "public", localPath);

  const cached = replicateFileCache.get(filePath);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const buffer = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".gif" ? "image/gif" : "image/jpeg";
  const filename = path.basename(filePath);

  const file = await replicate.files.create(
    new Blob([buffer], { type: mimeType }),
    { filename, content_type: mimeType }
  );

  const fileUrl = (file as { urls?: { get?: string } }).urls?.get ?? "";
  replicateFileCache.set(filePath, { url: fileUrl, expiresAt: Date.now() + REPLICATE_FILE_TTL });
  return fileUrl;
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const absoluteImageUrl = await toReplicateImage(imageUrl);

    const prompt = `Analyze this product image and return a JSON array of descriptive tags. 
    The tags should cover: product type, category, material, color, style, use case, target audience, season, and mood. 
    Provide 15-25 tags in total. 
    Return ONLY a JSON array of lowercase strings. No markdown, no explanation, no other text.
    Example: ["shirt", "cotton", "blue", "casual", "summer"]`;

    const output = await replicate.run(MODEL, {
      input: {
        prompt,
        images: [absoluteImageUrl],
        temperature: 0.2,
        max_output_tokens: 1024,
      },
    });

    const rawText = Array.isArray(output) ? output.join("") : String(output);
    console.log("[analyze-image] Gemini response:", rawText);

    const tags = parseModelStringArray(rawText);
    if (tags.length === 0) {
      throw new Error("Failed to parse tags from model response");
    }

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("[analyze-image] Error:", error);
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 });
  }
}
