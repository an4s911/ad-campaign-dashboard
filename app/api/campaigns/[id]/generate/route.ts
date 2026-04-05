import { NextRequest } from "next/server";
import Replicate from "replicate";
import prisma from "@/lib/prisma";
import { downloadAndStoreImage } from "@/lib/image-storage";
import { readFile } from "fs/promises";
import path from "path";

export const maxDuration = 300;

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const TEXT_MODEL = "google/gemini-3-flash";
const IMAGE_MODEL = "google/nano-banana-pro";
const IMAGE_MODEL_FALLBACK = "bytedance/seedream-4.5";
// Keep Gemini behavior pinned to the intended contract instead of relying on
// the freeform user prompt alone.
const GEMINI_SYSTEM_INSTRUCTION =
  'You are receiving a product image, product details, a text overlay to include in the image, and a style system prompt. Follow the style system prompt exactly to generate a JSON formatted image generation prompt. The text overlay must appear prominently in the generated image as readable text. Return only the JSON object as specified by the style system prompt, no markdown fences, no explanation.';

/** Module-level cache: local file path → { url, expiry }. Replicate files expire after 24h. */
const REPLICATE_FILE_TTL = 23 * 60 * 60 * 1000; // 23 hours (1h safety margin)
const replicateFileCache = new Map<string, { url: string; expiresAt: number }>();

interface Combo {
  product: {
    name: string;
    description: string;
    imageUrl1: string;
    imageUrl2: string | null;
  };
  adText: string;
  styleType: "library" | "uploaded";
  stylePrompt: string | null;
  styleReferenceImageUrl: string | null;
}

interface GeminiPromptJson {
  label?: string;
  prompt?: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  use_case?: string;
  recommended_settings?: unknown;
  [key: string]: unknown;
}

/**
 * Convert an image URL to a format Replicate can access.
 * - If already a public https URL, return as-is.
 * - If a local /uploads/... path, upload to Replicate's file hosting
 *   via replicate.files.create() and return the served URL.
 */
async function toReplicateImage(url: string): Promise<string> {
  if (url.startsWith("https://")) return url;
  if (url.startsWith("http://") && !url.includes("localhost") && !url.includes("127.0.0.1")) return url;

  // Local path — upload to Replicate's file hosting so models can access it
  const localPath = url.startsWith("/") ? url : `/${url}`;
  const filePath = path.join(process.cwd(), "public", localPath);

  const cached = replicateFileCache.get(filePath);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`[generate] cache hit for ${filePath}`);
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

function extractModelText(output: unknown): string {
  return typeof output === "string"
    ? output.trim()
    : Array.isArray(output)
      ? output.join("").trim()
      : String(output).trim();
}

function parseGeminiPromptJson(rawText: string): GeminiPromptJson {
  // Gemini occasionally wraps valid JSON in code fences; normalize first, then
  // require a real JSON object so downstream generation is deterministic.
  const cleanedText = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  const candidate = (jsonMatch?.[0] ?? cleanedText).trim();
  const parsed = JSON.parse(candidate) as GeminiPromptJson;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Gemini did not return a JSON object");
  }

  if (typeof parsed.prompt !== "string" || !parsed.prompt.trim()) {
    throw new Error("Gemini JSON response is missing a prompt field");
  }

  return parsed;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let campaign;
  try {
    campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        products: {
          where: { product: { isEnabled: true } },
          include: { product: true },
        },
        texts: {
          where: {
            isEnabled: true,
            product: { isEnabled: true },
          },
          orderBy: { sortOrder: "asc" },
        },
        styles: { include: { style: true } },
      },
    });
  } catch (error) {
    console.error("Failed to load campaign:", error);
    return Response.json({ error: "Failed to load campaign" }, { status: 500 });
  }

  if (!campaign) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }

  const texts = campaign.texts;
  const styles = campaign.styles;
  const products = campaign.products;

  if (texts.length === 0 || styles.length === 0 || products.length === 0) {
    return Response.json(
      { error: "Campaign needs at least one product, one ad text entry, and one style" },
      { status: 400 }
    );
  }

  // Build combo queue: for each product, pair its enabled text entries with each style
  const combos: Combo[] = [];
  for (const cp of products) {
    const productTexts = texts.filter((t) => t.productId === cp.productId);
    for (const text of productTexts) {
      for (const cs of styles) {
        combos.push({
          product: {
            name: cp.product.name,
            description: cp.product.description,
            imageUrl1: cp.product.imageUrl1,
            imageUrl2: cp.product.imageUrl2,
          },
          adText: text.text,
          styleType:
            cs.styleType === "uploaded" ? "uploaded" : "library",
          stylePrompt: cs.style?.prompt ?? null,
          styleReferenceImageUrl: cs.uploadedImageUrl ?? null,
        });
      }
    }
  }

  // Product-level text filtering can leave no valid combinations even when the
  // campaign still has products, styles, and enabled texts overall.
  if (combos.length === 0) {
    return Response.json(
      { error: "Campaign has no valid product, text, and style combinations" },
      { status: 400 }
    );
  }

  // Cycle through combos up to adCount
  const tasks: Combo[] = [];
  for (let i = 0; i < campaign.adCount; i++) {
    tasks.push(combos[i % combos.length]);
  }

  console.log(
    `[generate] ${products.length} products, ${texts.length} ad texts, ${styles.length} styles, ${combos.length} combos, ${tasks.length} tasks`
  );

  // Stream results via SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      send({ type: "start", total: tasks.length });

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        try {
          // Collect product image URLs (must be absolute for Replicate)
          const productImages = [await toReplicateImage(task.product.imageUrl1)];
          if (task.product.imageUrl2) {
            productImages.push(await toReplicateImage(task.product.imageUrl2));
          }

          const geminiImages = [...productImages];
          if (task.styleType === "uploaded" && task.styleReferenceImageUrl) {
            geminiImages.push(await toReplicateImage(task.styleReferenceImageUrl));
          }

          // Library styles already store the full style-system prompt. Uploaded
          // references only provide an image, so Gemini must infer the style
          // system from that reference before generating JSON output.
          const styleSystemPrompt =
            task.styleType === "uploaded"
              ? [
                  "Use the final attached image as the visual style reference for this ad.",
                  "Infer the style system prompt from that reference image and preserve its composition, lighting, typography treatment, layout rhythm, textures, depth, and mood.",
                  "Do not copy the reference product, brand, or exact wording from the reference image.",
                ].join("\n")
              : (task.stylePrompt ?? "").trim();

          // Step 1: Gemini 3 Flash — generate image prompt JSON
          const geminiPrompt = [
            "## Product Images",
            "The attached images are the product image inputs.",
            task.styleType === "uploaded"
              ? "The final attached image is the style reference."
              : "",
            "",
            "## Product",
            `Title: ${task.product.name}`,
            `Description: ${task.product.description}`,
            "",
            "## Text Entry",
            `Literal overlay text: "${task.adText}"`,
            "",
            "## Style System Prompt",
            styleSystemPrompt,
            "",
            "Return the JSON image generation prompt now.",
          ].join("\n");

          const geminiInput = {
            system_instruction: GEMINI_SYSTEM_INSTRUCTION,
            prompt: geminiPrompt,
            images: geminiImages,
            temperature: 0.7,
            thinking_level: "low",
            max_output_tokens: 2048,
          };

          console.log(`[generate] task ${i}: calling gemini...`, geminiInput);

          const textOutput = await replicate.run(TEXT_MODEL, {
            input: geminiInput,
          });

          // Parse text output
          const rawText = extractModelText(textOutput);

          console.log(`[generate] task ${i} Gemini response:`, rawText);

          // Preserve the full JSON response instead of collapsing everything to
          // a single prompt string; the image model can still benefit from
          // structured fields such as aspect_ratio.
          const promptJson = parseGeminiPromptJson(rawText);
          const imagePromptPayload = JSON.stringify(promptJson);
          const aspectRatio =
            typeof promptJson.aspect_ratio === "string" &&
            promptJson.aspect_ratio.trim()
              ? promptJson.aspect_ratio
              : "match_input_image";

          // Step 2: nano-banana — generate image (with seedream-4.5 fallback)
          console.log(`[generate] task ${i}: calling nano-banana...`, imagePromptPayload);

          let imageOutput: unknown;
          try {
            imageOutput = await replicate.run(IMAGE_MODEL, {
              input: {
                prompt: imagePromptPayload,
                image_input: productImages,
                aspect_ratio: aspectRatio,
                output_format: "jpg",
              },
            });
          } catch (primaryError) {
            console.warn(`[generate] task ${i}: nano-banana failed, falling back to seedream-4.5:`, primaryError);
            imageOutput = await replicate.run(IMAGE_MODEL_FALLBACK, {
              input: {
                prompt: imagePromptPayload,
                image_input: productImages,
                aspect_ratio: aspectRatio,
                output_format: "jpg",
              },
            });
          }

          // Extract URL from output
          // Replicate SDK returns FileOutput objects that have a url() method
          let outputUrl = "";
          function extractUrl(val: unknown): string {
            if (typeof val === "string") return val;
            if (val && typeof val === "object") {
              // FileOutput has a url() method that returns a URL object
              if ("url" in val && typeof (val as Record<string, unknown>).url === "function") {
                return String((val as { url: () => unknown }).url());
              }
              // Or it might have a url property
              if ("url" in val && typeof (val as Record<string, unknown>).url === "string") {
                return (val as { url: string }).url;
              }
              // Or href
              if ("href" in val && typeof (val as Record<string, unknown>).href === "string") {
                return (val as { href: string }).href;
              }
            }
            return String(val);
          }

          if (Array.isArray(imageOutput) && imageOutput.length > 0) {
            outputUrl = extractUrl(imageOutput[0]);
          } else {
            outputUrl = extractUrl(imageOutput);
          }

          if (!outputUrl || outputUrl === "undefined" || outputUrl === "null") {
            throw new Error("No image URL in model output");
          }

          // Step 3: Download and store image
          console.log(`[generate] task ${i}: storing image...`);
          const storedUrl = await downloadAndStoreImage(outputUrl, ".jpg");

          // Step 4: Save to database
          const savedImage = await prisma.generatedImage.create({
            data: {
              campaignId: id,
              imageUrl: storedUrl,
              status: "completed",
            },
          });

          console.log(`[generate] task ${i}: done — ${savedImage.id}`);
          send({ type: "image", index: i, image: savedImage });
        } catch (error) {
          console.error(`[generate] task ${i} failed:`, error);

          // Save failed record
          const failedImage = await prisma.generatedImage.create({
            data: {
              campaignId: id,
              imageUrl: "",
              status: "failed",
            },
          });

          send({ type: "error", index: i, image: failedImage, error: String(error) });
        }
      }

      send({ type: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
