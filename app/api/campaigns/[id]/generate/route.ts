import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import prisma from "@/lib/prisma";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

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
        styles: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Build prompt from campaign data
    const productDescriptions = campaign.products
      .map((cp) => `- ${cp.product.name}: ${cp.product.description}`)
      .join("\n");

    const ideaDescriptions = campaign.ideas
      .map((idea) => `- ${idea.description}`)
      .join("\n");

    const styleDescriptions = campaign.styles
      .map((style) =>
        style.styleType === "preset"
          ? `- Preset style: ${style.presetName}`
          : `- Uploaded reference: ${style.uploadedImageUrl}`
      )
      .join("\n");

    const prompt = [
      `Create a professional advertising image for the campaign "${campaign.name}".`,
      "",
      "Products featured:",
      productDescriptions,
      "",
      "Creative direction:",
      ideaDescriptions,
      "",
      "Style:",
      styleDescriptions,
      "",
      `Target audience: ${JSON.stringify(campaign.targetTags)}`,
      `Target gender: ${JSON.stringify(campaign.targetGender)}`,
      `Age range: ${campaign.targetAgeMin ?? "any"} - ${campaign.targetAgeMax ?? "any"}`,
      `Store categories: ${JSON.stringify(campaign.targetStoreCategories)}`,
    ].join("\n");

    // Generate images using Replicate (SDXL)
    const numImages = campaign.adCount;
    const imagePromises = Array.from({ length: numImages }, async () => {
      const output = await replicate.run(
        "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
        {
          input: {
            prompt,
            width: 1024,
            height: 1024,
            num_outputs: 1,
          },
        }
      );
      return output;
    });

    const results = await Promise.all(imagePromises);

    // Extract image URLs from results
    const imageUrls: string[] = [];
    for (const result of results) {
      if (Array.isArray(result)) {
        for (const item of result) {
          if (typeof item === "string") {
            imageUrls.push(item);
          } else if (item && typeof item === "object" && "url" in item) {
            imageUrls.push((item as { url: string }).url);
          }
        }
      } else if (typeof result === "string") {
        imageUrls.push(result);
      }
    }

    // Save generated image records to the database
    const generatedImages = await prisma.$transaction(
      imageUrls.map((url) =>
        prisma.generatedImage.create({
          data: {
            campaignId: id,
            imageUrl: url,
          },
        })
      )
    );

    return NextResponse.json({
      campaign: campaign.name,
      prompt,
      images: generatedImages,
    });
  } catch (error) {
    console.error("Failed to generate images:", error);
    return NextResponse.json(
      { error: "Failed to generate images" },
      { status: 500 }
    );
  }
}
