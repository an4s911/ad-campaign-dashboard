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

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            products: true,
            generatedImages: { where: { isDeleted: false } },
          },
        },
      },
    });

    const result = campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      adCount: campaign.adCount,
      status: campaign.status,
      targetStoreCategories: campaign.targetStoreCategories,
      targetAgeMin: campaign.targetAgeMin,
      targetAgeMax: campaign.targetAgeMax,
      targetGender: campaign.targetGender,
      targetTags: campaign.targetTags,
      targetProductTags: campaign.targetProductTags,
      targetIncome: campaign.targetIncome,
      targetShoppingBehavior: campaign.targetShoppingBehavior,
      targetDays: campaign.targetDays,
      targetTimeOfDay: campaign.targetTimeOfDay,
      targetWeather: campaign.targetWeather,
      targetLocations: campaign.targetLocations,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      productCount: campaign._count.products,
      generatedImageCount: campaign._count.generatedImages,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      : [];

    if (!name || !adCount) {
      return NextResponse.json(
        { error: "name and adCount are required" },
        { status: 400 }
      );
    }

    if (normalizedProductIds.length === 0) {
      return NextResponse.json(
        { error: "At least one productId is required" },
        { status: 400 }
      );
    }

    const campaign = await prisma.$transaction(async (tx) => {
      const created = await tx.campaign.create({
        data: {
          name,
          adCount,
          targetStoreCategories: targetStoreCategories ?? [],
          targetAgeMin: targetAgeMin ?? null,
          targetAgeMax: targetAgeMax ?? null,
          targetGender: targetGender ?? [],
          targetTags: targetTags ?? [],
          targetProductTags: targetProductTags ?? [],
          targetIncome: targetIncome ?? [],
          targetShoppingBehavior: targetShoppingBehavior ?? [],
          targetDays: targetDays ?? ["mon","tue","wed","thu","fri","sat","sun"],
          targetTimeOfDay: targetTimeOfDay ?? ["all_day"],
          targetWeather: targetWeather ?? ["any"],
          targetLocations: targetLocations ?? [],
        },
      });

      await tx.campaignProduct.createMany({
        data: normalizedProductIds.map((productId) => ({
          campaignId: created.id,
          productId,
        })),
      });

      const normalizedTexts = normalizeCampaignTexts(rawTexts, normalizedProductIds);
      if (normalizedTexts.length > 0) {
        await tx.campaignText.createMany({
          data: normalizedTexts.map((text) => ({
            campaignId: created.id,
            productId: text.productId,
            text: text.text,
            isEnabled: text.isEnabled,
            sortOrder: text.sortOrder,
          })),
        });
      }

      if (normalizedStyles.length > 0) {
        await tx.campaignStyle.createMany({
          data: normalizedStyles.map((style) => ({
            campaignId: created.id,
            styleId: style.styleId,
            styleType: style.styleType,
            uploadedImageUrl: style.uploadedImageUrl,
          })),
        });
      }

      return tx.campaign.findUnique({
        where: { id: created.id },
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
        },
      });
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Failed to create campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
