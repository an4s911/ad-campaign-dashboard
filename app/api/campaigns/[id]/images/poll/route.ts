import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import prisma from "@/lib/prisma";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find all pending images for this campaign
    const pendingImages = await prisma.generatedImage.findMany({
      where: {
        campaignId: id,
        status: "pending",
        isDeleted: false,
        replicatePredictionId: { not: null },
      },
    });

    // Check each prediction on Replicate and update accordingly
    for (const img of pendingImages) {
      try {
        const prediction = await replicate.predictions.get(
          img.replicatePredictionId!
        );

        if (prediction.status === "succeeded" && prediction.output) {
          // Extract URL from output
          let imageUrl = "";
          if (Array.isArray(prediction.output) && prediction.output.length > 0) {
            const first = prediction.output[0];
            if (typeof first === "string") {
              imageUrl = first;
            } else if (first && typeof first === "object" && "url" in first) {
              imageUrl = (first as { url: string }).url;
            }
          } else if (typeof prediction.output === "string") {
            imageUrl = prediction.output;
          }

          await prisma.generatedImage.update({
            where: { id: img.id },
            data: { status: "completed", imageUrl },
          });
        } else if (
          prediction.status === "failed" ||
          prediction.status === "canceled"
        ) {
          await prisma.generatedImage.update({
            where: { id: img.id },
            data: { status: "failed" },
          });
        }
        // If still processing, leave as pending
      } catch (error) {
        console.error(
          `Failed to check prediction ${img.replicatePredictionId}:`,
          error
        );
      }
    }

    // Return all non-deleted images for this campaign (fresh read)
    const allImages = await prisma.generatedImage.findMany({
      where: { campaignId: id, isDeleted: false },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(allImages);
  } catch (error) {
    console.error("Failed to poll images:", error);
    return NextResponse.json(
      { error: "Failed to poll images" },
      { status: 500 }
    );
  }
}
