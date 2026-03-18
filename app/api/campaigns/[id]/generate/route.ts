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

    // Create predictions on Replicate without waiting for results
    const numImages = campaign.adCount;
    const predictions = await Promise.all(
      Array.from({ length: numImages }, () =>
        replicate.predictions.create({
          version:
            "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
          input: {
            prompt,
            width: 1024,
            height: 1024,
            num_outputs: 1,
          },
        })
      )
    );

    // Save pending image records to the database
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
