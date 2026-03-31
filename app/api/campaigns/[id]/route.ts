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

function normalizeCampaignTexts(
  input: unknown,
  allowedProductIds: string[]
): Array<{
  productId: string;
  text: string;
  isEnabled: boolean;
  sortOrder: number;
}> {
  if (!Array.isArray(input)) {
    return [];
  }

  const allowedSet = new Set(allowedProductIds);

  return input.reduce<
    Array<{
      productId: string;
      text: string;
      isEnabled: boolean;
      sortOrder: number;
    }>
  >((accumulator, item, index) => {
    if (!item || typeof item !== "object") {
      return accumulator;
    }

    const productId =
      typeof (item as { productId?: string }).productId === "string"
        ? (item as { productId: string }).productId.trim()
        : "";
    const text =
      typeof (item as { text?: string }).text === "string"
        ? (item as { text: string }).text.trim()
        : "";

    if (!productId || !allowedSet.has(productId) || !text) {
      return accumulator;
    }

    accumulator.push({
      productId,
      text,
      isEnabled: (item as { isEnabled?: boolean }).isEnabled ?? true,
      sortOrder: index,
    });
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
        products: {
          where: { product: { isEnabled: true } },
          include: { product: true },
        },
        texts: {
          where: { product: { isEnabled: true } },
          orderBy: { sortOrder: "asc" },
        },
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
      texts: rawTexts,
      styles,
    } = body;
    const normalizedStyles = normalizeCampaignStyles(styles);
    const normalizedProductIds = Array.isArray(productIds)
      ? productIds
          .filter((productId: unknown): productId is string => typeof productId === "string")
          .map((productId) => productId.trim())
          .filter(Boolean)
      : undefined;

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
        if (normalizedProductIds && normalizedProductIds.length > 0) {
          await tx.campaignProduct.createMany({
            data: normalizedProductIds.map((productId) => ({
              campaignId: id,
              productId,
            })),
          });
        }
      }

      if (rawTexts !== undefined) {
        const allowedProductIds =
          normalizedProductIds ??
          (
            await tx.campaignProduct.findMany({
              where: { campaignId: id },
              select: { productId: true },
            })
          ).map((entry) => entry.productId);
        const normalizedTexts = normalizeCampaignTexts(rawTexts, allowedProductIds);

        await tx.campaignText.deleteMany({ where: { campaignId: id } });
        if (normalizedTexts.length > 0) {
          await tx.campaignText.createMany({
            data: normalizedTexts.map((text) => ({
              campaignId: id,
              productId: text.productId,
              text: text.text,
              isEnabled: text.isEnabled,
              sortOrder: text.sortOrder,
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
          products: {
            where: { product: { isEnabled: true } },
            include: { product: true },
          },
          texts: {
            where: { product: { isEnabled: true } },
            orderBy: { sortOrder: "asc" },
          },
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
