import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import prisma from "@/lib/prisma";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const TEXT_MODEL = "meta/meta-llama-3-70b-instruct";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        products: { include: { product: true } },
        ideas: { orderBy: { sortOrder: "asc" } },
        styles: { include: { style: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const ideas = campaign.ideas;
    const styles = campaign.styles;

    if (ideas.length === 0 || styles.length === 0) {
      return NextResponse.json(
        { error: "Campaign needs at least one idea and one style" },
        { status: 400 }
      );
    }

    const productInfo = campaign.products
      .map((cp) => `- ${cp.product.name}: ${cp.product.description}`)
      .join("\n");

    const targetingContext = [
      `Target audience tags: ${JSON.stringify(campaign.targetTags)}`,
      `Target gender: ${JSON.stringify(campaign.targetGender)}`,
      `Age range: ${campaign.targetAgeMin ?? "any"} - ${campaign.targetAgeMax ?? "any"}`,
      `Store categories: ${JSON.stringify(campaign.targetStoreCategories)}`,
    ].join("\n");

    // Build style × idea combos — ideas rotate first so every idea gets used
    const combos: { idea: string; stylePrompt: string }[] = [];
    for (const cs of styles) {
      for (const idea of ideas) {
        combos.push({
          idea: idea.description,
          stylePrompt: cs.style.prompt,
        });
      }
    }

    const tasks: { idea: string; stylePrompt: string }[] = [];
    for (let i = 0; i < campaign.adCount; i++) {
      tasks.push(combos[i % combos.length]);
    }

    console.log(`[generate] ${ideas.length} ideas, ${styles.length} styles, ${combos.length} combos, ${tasks.length} tasks`);
    tasks.forEach((t, i) => console.log(`[generate] task ${i}: idea="${t.idea.slice(0, 60)}..."`));

    // Step 1: For each task, call text LLM to produce image prompt JSON
    const textPromises = tasks.map(async (task, taskIndex) => {
      const systemPrompt = `You are an expert advertising creative director. Given a style guide, product information, campaign idea, and targeting data, produce a JSON object with exactly these keys: "prompt" (a detailed text-to-image prompt for FLUX), "negative_prompt" (what to avoid), "aspect_ratio" (e.g. "1:1"). Respond with ONLY the JSON, no explanation.`;

      const userPrompt = [
        "## Style Guide",
        task.stylePrompt,
        "",
        "## Products",
        productInfo,
        "",
        "## Campaign Idea",
        task.idea,
        "",
        "## Targeting",
        targetingContext,
        "",
        "Produce the JSON prompt for image generation:",
      ].join("\n");

      const output = await replicate.run(TEXT_MODEL, {
        input: {
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          max_tokens: 512,
          temperature: 0.7,
        },
      });

      // replicate.run for text models returns an array of string tokens
      const text = Array.isArray(output) ? output.join("") : String(output);

      console.log(`[generate] task ${taskIndex} LLM response:`, text.slice(0, 200));

      // Parse JSON from the response
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log(`[generate] task ${taskIndex} prompt:`, parsed.prompt?.slice(0, 100));
          return parsed;
        }
      } catch {
        // fall through to fallback
      }

      // Fallback: use raw text as prompt
      return { prompt: text, negative_prompt: "", aspect_ratio: "1:1" };
    });

    const promptResults = await Promise.all(textPromises);

    // Step 2: Send each prompt to FLUX for image generation
    const predictions = await Promise.all(
      promptResults.map((result) =>
        replicate.predictions.create({
          version:
            "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
          input: {
            prompt: result.prompt,
            width: 1024,
            height: 1024,
            num_outputs: 1,
          },
        })
      )
    );

    // Step 3: Save pending image records
    const pendingImages = await prisma.$transaction(
      predictions.map((prediction) =>
        prisma.generatedImage.create({
          data: {
            campaignId: id,
            imageUrl: "",
            replicatePredictionId: prediction.id,
            status: "pending",
          },
        })
      )
    );

    return NextResponse.json({
      campaign: campaign.name,
      images: pendingImages,
    });
  } catch (error) {
    console.error("Failed to generate images:", error);
    return NextResponse.json(
      { error: "Failed to generate images" },
      { status: 500 }
    );
  }
}
