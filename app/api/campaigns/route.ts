import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
      productIds,
      ideas,
      styles,
    } = body;

    if (!name || !adCount) {
      return NextResponse.json(
        { error: "name and adCount are required" },
        { status: 400 }
      );
    }

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
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
        },
      });

      await tx.campaignProduct.createMany({
        data: productIds.map((productId: string) => ({
          campaignId: created.id,
          productId,
        })),
      });

      if (ideas && Array.isArray(ideas) && ideas.length > 0) {
        await tx.campaignIdea.createMany({
          data: ideas.map((description: string, index: number) => ({
            campaignId: created.id,
            description,
            sortOrder: index,
          })),
        });
      }

      if (styles && Array.isArray(styles) && styles.length > 0) {
        await tx.campaignStyle.createMany({
          data: styles.map(
            (style: {
              styleType: string;
              presetName?: string;
              uploadedImageUrl?: string;
            }) => ({
              campaignId: created.id,
              styleType: style.styleType,
              presetName: style.presetName ?? null,
              uploadedImageUrl: style.uploadedImageUrl ?? null,
            })
          ),
        });
      }

      return tx.campaign.findUnique({
        where: { id: created.id },
        include: {
          products: { include: { product: true } },
          ideas: { orderBy: { sortOrder: "asc" } },
          styles: true,
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
