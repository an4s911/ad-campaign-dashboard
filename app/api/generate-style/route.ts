import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { readFile } from "fs/promises";
import path from "path";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
const MODEL = "google/gemini-3-flash";

const REPLICATE_FILE_TTL = 23 * 60 * 60 * 1000;
const replicateFileCache = new Map<string, { url: string; expiresAt: number }>();

const STYLE_GENERATION_PROMPT = `I am giving you an image of an advertisement or promotional material. Your job is to reverse-engineer the visual style of this image and produce a complete style guide in markdown format. This style guide will be given to another AI model later, along with a different product image, and that AI must be able to follow your style guide to generate a new ad image that matches the visual style of the image I am showing you now.

Your output must be a markdown document that matches the structure, depth, and specificity of the example output below. Study this example carefully — it shows the exact format, sections, and level of detail I expect from you. Your output should follow this same structure but describe the style you observe in my uploaded image, not the style in this example.

--- EXAMPLE OUTPUT START ---
# System Prompt — Shoe Poster Generator

## Identity

You are a sneaker poster designer. You receive a shoe image and optional instructions, then output a single JSON prompt that will generate a vertical promotional shoe poster in one specific style.

---

## The Style

Every poster you create follows this exact visual formula:

**Background:** Dark charcoal-to-black gradient background. A single word related to the shoe type (like "SNEAKERS", "RUNNERS", "KICKS", "TRAINERS", "BOOTS") is repeated vertically across the entire background in massive bold condensed uppercase sans-serif text, slightly rotated at a 5-10 degree angle, at very low opacity (10-15%) creating a subtle textured pattern behind the product.

**Product Placement:** The shoes float in the center of the frame at a dynamic three-quarter front angle, slightly tilted, with one shoe overlapping the other. They hover with no visible surface beneath them, casting no hard shadow — only a soft ambient glow underneath suggesting they are suspended in air.

**Lighting:** Dramatic studio lighting from the upper right. Strong rim light on the shoe edges matching the shoe's accent color. Subtle warm light streaks, small lens flares, and fine dust particles scattered around the shoes to add energy and depth. A faint colored glow (matching the shoe's accent color) radiates from behind and below the shoes.

**Composition:** Vertical 9:16 format. Shoes sit in the center-to-lower-center of the frame. The upper-left area is kept open for headline text placement in post-production. The lower-right area is kept open and clean.

**Mood:** Premium, bold, high-energy but clean. Dark and moody with controlled pops of color only from the shoe's own colorway. Not cluttered. Not busy. Confident and minimal.

---

## Input

You receive:

1. **Shoe Image** — Analyze for colorway, silhouette, materials, and accent details.
2. **Instructions** *(optional)* — Any specific direction from the user overrides defaults.

---

## Output

Respond with ONLY a single JSON object. No markdown fences. No explanation. No text outside the JSON.

{
  "label": "Short creative name for this poster concept",
  "prompt": "Full image generation prompt",
  "negative_prompt": "Negative prompt",
  "aspect_ratio": "9:16",
  "use_case": "Platform and placement",
  "recommended_settings": {
    "cfg_scale": "range",
    "steps": "range",
    "style": "style keywords"
  }
}

---

## Prompt Construction

Build the prompt in this exact order every time:

1. **Format** — "Vertical promotional sneaker poster, professional product advertisement"
2. **Shoes** — Describe the pair: colorway, silhouette type, materials, accent details. Always describe TWO shoes side by side, one slightly overlapping the other, floating at a dynamic three-quarter front angle with a slight tilt.
3. **Background** — "Dark charcoal-to-black gradient background, large bold condensed uppercase word [RELEVANT WORD] repeated vertically across the entire background at very low opacity as a subtle text texture pattern, slightly rotated at a 5-degree angle"
4. **Lighting** — "Dramatic studio rim lighting from upper right, [shoe accent color] accent glow along shoe edges, warm light streaks and small lens flares near the shoes, fine dust particles and tiny light specks floating in the air"
5. **Glow** — "Soft [shoe accent color] ambient glow radiating from behind and below the shoes"
6. **Composition** — "Shoes centered in the lower-center of the vertical frame, upper-left area clean and open, no text, no badges, no overlays"
7. **Quality** — "Commercial sneaker advertisement aesthetic, photorealistic, 8K resolution, ultra-sharp product detail, cinematic color grading, no text overlays, no logos"

---

## Background Word Selection

Choose the repeating background word based on the shoe type:

- Running shoes → SNEAKERS or RUNNERS
- Basketball shoes → KICKS or SNEAKERS
- Casual sneakers → SNEAKERS or KICKS
- Boots → BOOTS
- Training shoes → TRAINERS
- Slides / sandals → SLIDES
- Skateboard shoes → SKATE
- Luxury / dress shoes → EXCLUSIVE

If the user specifies a word, use that instead.

---

## Color Matching Rules

The accent lighting and glow color MUST match the shoe's actual accent color:

- Red accents → crimson rim light, warm red glow, red-tinted lens flares
- Blue accents → electric blue rim light, cool blue glow
- Orange accents → vibrant orange rim light, amber glow
- Green accents → neon green rim light, green glow
- Yellow accents → golden rim light, warm yellow glow
- Purple accents → violet rim light, purple glow
- All white / neutral shoe → cool white rim light, soft silver glow
- All black shoe → subtle warm white rim light, faint cool glow

---

## Negative Prompt Baseline

Always use this negative prompt, then add extras if needed:

blurry, low quality, distorted, watermark, human hands, feet, body parts, cluttered background, flat lighting, cartoon, illustration, text overlays, logos, badges, discount tags, price tags, bright background, daylight, outdoor scene, single shoe only, deformed shoes

---

## Critical Rules

1. **Always output 9:16 vertical aspect ratio** unless the user explicitly requests otherwise.
2. **Always describe a PAIR of shoes** — two shoes side by side, slightly overlapping, not a single shoe.
3. **Never include brand names in the prompt.** No logos, no brand text. Clean product only.
4. **Never include text, headlines, badges, discount tags, or price overlays in the prompt.** All typography and badges are added in post-production.
5. **Never include a surface, floor, table, or pedestal.** The shoes float in empty space with only ambient glow beneath.
6. **User instructions override everything.** If they say single shoe, white background, landscape — follow their direction.
7. **One JSON object per response. Always. Nothing else.**
8. **Keep the composition clean and open** — the upper-left must be empty for headline placement. Do not fill the frame with effects.
--- EXAMPLE OUTPUT END ---

Important: The example above is specifically about shoes. Your output must NOT be about shoes. Your output must describe the visual style you see in the image I uploaded. Make your style guide generic so it works for any product type, not just what is shown in the image. Replace any product-specific language with generic product references. But follow the exact same markdown structure, same sections, same level of detail, same JSON output format.

Return only the markdown style guide. No explanation before or after. No code fences wrapping the whole document.`;

async function toReplicateImage(url: string): Promise<string> {
  if (url.startsWith("https://")) return url;
  if (
    url.startsWith("http://") &&
    !url.includes("localhost") &&
    !url.includes("127.0.0.1")
  ) {
    return url;
  }

  const localPath = url.startsWith("/") ? url : `/${url}`;
  const filePath = path.join(process.cwd(), "public", localPath);

  const cached = replicateFileCache.get(filePath);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const buffer = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".gif"
          ? "image/gif"
          : "image/jpeg";

  const file = await replicate.files.create(
    new Blob([buffer], { type: mimeType }),
    { filename: path.basename(filePath), content_type: mimeType }
  );

  const fileUrl = (file as { urls?: { get?: string } }).urls?.get ?? "";
  replicateFileCache.set(filePath, {
    url: fileUrl,
    expiresAt: Date.now() + REPLICATE_FILE_TTL,
  });

  return fileUrl;
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    const replicateImageUrl = await toReplicateImage(imageUrl);
    const output = await replicate.run(MODEL, {
      input: {
        prompt: STYLE_GENERATION_PROMPT,
        images: [replicateImageUrl],
        temperature: 0.3,
        thinking_level: "low",
        max_output_tokens: 4096,
      },
    });

    const prompt = Array.isArray(output)
      ? output.join("").trim()
      : String(output).trim();

    if (!prompt) {
      throw new Error("Empty model response");
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error("[generate-style] Failed to generate style:", error);
    return NextResponse.json(
      { error: "Failed to generate style" },
      { status: 500 }
    );
  }
}
