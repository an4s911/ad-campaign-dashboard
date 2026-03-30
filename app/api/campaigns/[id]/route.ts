import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function normalizeCampaignStyles(
  input: unknown
): Array<{
  styleType: "library" | "uploaded";
  styleId: string | null;
  uploadedImageUrl: string | null;
}> {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.reduce<
    Array<{
      styleType: "library" | "uploaded";
      styleId: string | null;
      uploadedImageUrl: string | null;
    }>
  >((accumulator, item) => {
    if (typeof item === "string" && item.trim()) {
      accumulator.push({
        styleType: "library",
        styleId: item.trim(),
        uploadedImageUrl: null,
      });
      return accumulator;
    }

    if (!item || typeof item !== "object") {
      return accumulator;
    }

    const styleType =
      (item as { styleType?: string }).styleType === "uploaded"
        ? "uploaded"
        : "library";
    const styleId =
      typeof (item as { styleId?: string }).styleId === "string" &&
      (item as { styleId?: string }).styleId?.trim()
        ? (item as { styleId: string }).styleId.trim()
        : null;
    const uploadedImageUrl =
      typeof (item as { uploadedImageUrl?: string }).uploadedImageUrl ===
        "string" &&
      (item as { uploadedImageUrl?: string }).uploadedImageUrl?.trim()
        ? (item as { uploadedImageUrl: string }).uploadedImageUrl.trim()
        : null;

    if (styleType === "uploaded" && uploadedImageUrl) {
      accumulator.push({
        styleType: "uploaded",
        styleId: null,
        uploadedImageUrl,
      });
      return accumulator;
    }

    if (styleId) {
      accumulator.push({
        styleType: "library",
        styleId,
        uploadedImageUrl: null,
      });
    }

    return accumulator;
  }, []);
}

export async function GET(
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
        generatedImages: {
          where: { isDeleted: false },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Failed to fetch campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      adCount,
      targetStoreCategories,
      targetAgeMin,
      targetAgeMax,
      targetGender,
      targetTags,
      targetProductTags,
      targetIncome,
      targetShoppingBehavior,
      targetDays,
      targetTimeOfDay,
      targetWeather,
      targetLocations,
      productIds,
      ideas,
      styles,
    } = body;
    const normalizedStyles = normalizeCampaignStyles(styles);

    const campaign = await prisma.$transaction(async (tx) => {
      await tx.campaign.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(adCount !== undefined && { adCount }),
          ...(targetStoreCategories !== undefined && { targetStoreCategories }),
          ...(targetAgeMin !== undefined && { targetAgeMin }),
          ...(targetAgeMax !== undefined && { targetAgeMax }),
          ...(targetGender !== undefined && { targetGender }),
          ...(targetTags !== undefined && { targetTags }),
          ...(targetProductTags !== undefined && { targetProductTags }),
          ...(targetIncome !== undefined && { targetIncome }),
          ...(targetShoppingBehavior !== undefined && { targetShoppingBehavior }),
          ...(targetDays !== undefined && { targetDays }),
          ...(targetTimeOfDay !== undefined && { targetTimeOfDay }),
          ...(targetWeather !== undefined && { targetWeather }),
          ...(targetLocations !== undefined && { targetLocations }),
        },
      });

      if (productIds !== undefined) {
        await tx.campaignProduct.deleteMany({ where: { campaignId: id } });
        if (Array.isArray(productIds) && productIds.length > 0) {
          await tx.campaignProduct.createMany({
            data: productIds.map((productId: string) => ({
              campaignId: id,
              productId,
            })),
          });
        }
      }

      if (ideas !== undefined) {
        await tx.campaignIdea.deleteMany({ where: { campaignId: id } });
        if (Array.isArray(ideas) && ideas.length > 0) {
          await tx.campaignIdea.createMany({
            data: ideas.map((description: string, index: number) => ({
              campaignId: id,
              description,
              sortOrder: index,
            })),
          });
        }
      }

      if (styles !== undefined) {
        await tx.campaignStyle.deleteMany({ where: { campaignId: id } });
        if (normalizedStyles.length > 0) {
          await tx.campaignStyle.createMany({
            data: normalizedStyles.map((style) => ({
              campaignId: id,
              styleId: style.styleId,
              styleType: style.styleType,
              uploadedImageUrl: style.uploadedImageUrl,
            })),
          });
        }
      }

      return tx.campaign.findUnique({
        where: { id },
        include: {
          products: { include: { product: true } },
          ideas: { orderBy: { sortOrder: "asc" } },
          styles: { include: { style: true } },
          generatedImages: {
            where: { isDeleted: false },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Failed to update campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.campaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
