import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
    // TODO: Replace this with actual Replicate API integration
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
      `Campaign: ${campaign.name}`,
      `Number of ads requested: ${campaign.adCount}`,
      "",
      "Products:",
      productDescriptions,
      "",
      "Creative Ideas:",
      ideaDescriptions,
      "",
      "Style References:",
      styleDescriptions,
      "",
      `Target Store Categories: ${JSON.stringify(campaign.targetStoreCategories)}`,
      `Target Age: ${campaign.targetAgeMin ?? "any"} - ${campaign.targetAgeMax ?? "any"}`,
      `Target Gender: ${JSON.stringify(campaign.targetGender)}`,
      `Target Tags: ${JSON.stringify(campaign.targetTags)}`,
    ].join("\n");

    // TODO: Send prompt to Replicate API and get generated image URLs back
    // Example Replicate integration:
    //   const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    //   const output = await replicate.run("model-name", { input: { prompt } });

    // Mock response: generate 10 placeholder image URLs
    const placeholderImages = Array.from({ length: 10 }, (_, i) => ({
      imageUrl: `https://placehold.co/1024x1024/png?text=Ad+${i + 1}`,
      replicatePredictionId: `mock-prediction-${id}-${i + 1}`,
    }));

    // Save generated image records to the database
    const generatedImages = await prisma.$transaction(
      placeholderImages.map((img) =>
        prisma.generatedImage.create({
          data: {
            campaignId: id,
            imageUrl: img.imageUrl,
            replicatePredictionId: img.replicatePredictionId,
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
