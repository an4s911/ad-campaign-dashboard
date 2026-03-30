import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { parseModelStringArray } from "@/lib/ai/parseModelStringArray";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
const MODEL = "google/gemini-3-flash";

export async function POST(request: NextRequest) {
  try {
    const { currentTags } = await request.json();

    if (!currentTags || !Array.isArray(currentTags)) {
      return NextResponse.json({ error: "currentTags array is required" }, { status: 400 });
    }

    const prompt = `Based on these product tags: [${currentTags.join(", ")}], suggest 5-10 related tags that are not already in the list.
    Return ONLY a JSON array of lowercase strings. No markdown, no explanation, no other text.`;

    const output = await replicate.run(MODEL, {
      input: {
        prompt,
        temperature: 0.7,
        max_output_tokens: 512,
      },
    });

    const rawText = Array.isArray(output) ? output.join("") : String(output);
    console.log("[suggest-tags] Gemini response:", rawText);

    const tags = parseModelStringArray(rawText);
    if (tags.length === 0) {
      throw new Error("Failed to parse suggestions from model response");
    }

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("[suggest-tags] Error:", error);
    return NextResponse.json({ error: "Failed to suggest tags" }, { status: 500 });
  }
}
