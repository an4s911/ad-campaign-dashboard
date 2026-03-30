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
  idea: string;
  styleType: "library" | "uploaded";
  stylePrompt: string | null;
  styleReferenceImageUrl: string | null;
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
        products: { include: { product: true } },
        ideas: { orderBy: { sortOrder: "asc" } },
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

  const ideas = campaign.ideas;
  const styles = campaign.styles;
  const products = campaign.products;

  if (ideas.length === 0 || styles.length === 0 || products.length === 0) {
    return Response.json(
      { error: "Campaign needs at least one product, one idea, and one style" },
      { status: 400 }
    );
  }

  // Build combo queue: products × ideas × styles
  const combos: Combo[] = [];
  for (const cp of products) {
    for (const idea of ideas) {
      for (const cs of styles) {
        combos.push({
          product: {
            name: cp.product.name,
            description: cp.product.description,
            imageUrl1: cp.product.imageUrl1,
            imageUrl2: cp.product.imageUrl2,
          },
          idea: idea.description,
          styleType:
            cs.styleType === "uploaded" ? "uploaded" : "library",
          stylePrompt: cs.style?.prompt ?? null,
          styleReferenceImageUrl: cs.uploadedImageUrl ?? null,
        });
      }
    }
  }

  // Cycle through combos up to adCount
  const tasks: Combo[] = [];
  for (let i = 0; i < campaign.adCount; i++) {
    tasks.push(combos[i % combos.length]);
  }

  console.log(
    `[generate] ${products.length} products, ${ideas.length} ideas, ${styles.length} styles, ${combos.length} combos, ${tasks.length} tasks`
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

          const styleSection =
            task.styleType === "uploaded"
              ? [
                  "## Style Reference",
                  "The final image attached is a reference advertisement that defines the target visual style.",
                  "Analyze that reference image for composition, lighting, color treatment, typography treatment, layout rhythm, textures, depth, and mood.",
                  "Transfer only the visual style from the reference image. Do not copy the specific product, brand, or text from the reference image.",
                  "",
                ].join("\n")
              : [
                  "## Style Guide",
                  task.stylePrompt ?? "",
                  "",
                ].join("\n");

          // Step 1: Gemini 3 Flash — generate image prompt JSON
          const geminiPrompt = [
            styleSection,
            "## Product",
            `Title: ${task.product.name}`,
            `Description: ${task.product.description}`,
            "",
            "## Campaign Idea",
            task.idea,
            "",
            task.styleType === "uploaded"
              ? "The first one or two images are the product images. The final image is the style reference."
              : "The attached image(s) are the product images.",
            "",
            "Generate the creative direction JSON:",
          ].join("\n");

          const geminiInput = {
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
          const rawText = typeof textOutput === "string"
            ? textOutput
            : Array.isArray(textOutput)
              ? textOutput.join("")
              : String(textOutput);

          console.log(`[generate] task ${i} Gemini response:`, rawText);

          let imagePrompt = rawText;
          try {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              imagePrompt = parsed.prompt || rawText;
            }
          } catch {
            // Use raw text as fallback prompt
          }

          // Step 2: nano-banana — generate image
          console.log(`[generate] task ${i}: calling nano-banana...`);

          const imageOutput = await replicate.run(IMAGE_MODEL, {
            input: {
              prompt: imagePrompt,
              image_input: productImages,
              aspect_ratio: "match_input_image",
              output_format: "jpg",
            },
          });

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
