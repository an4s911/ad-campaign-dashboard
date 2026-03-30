import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl1: true,
        imageUrl2: true,
        isEnabled: true,
        createdAt: true,
        tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...product,
      tags: product.tags.map((pt) => pt.tag.name),
    });
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
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
    const { name, description, imageUrl1, imageUrl2, isEnabled, tags } = body;

    // Process tags if provided
    let tagData = {};
    if (tags !== undefined) {
      const tagNames = Array.isArray(tags) ? tags : [];
      const tagIds = await Promise.all(
        tagNames.map(async (tagName: string) => {
          const name = tagName.toLowerCase().trim();
          const tag = await prisma.tag.upsert({
            where: { name },
            update: {},
            create: { name },
          });
          return tag.id;
        })
      );

      tagData = {
        tags: {
          deleteMany: {},
          create: tagIds.map((tagId) => ({
            tagId,
          })),
        },
      };
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(imageUrl1 !== undefined && { imageUrl1 }),
        ...(imageUrl2 !== undefined && { imageUrl2 }),
        ...(isEnabled !== undefined && { isEnabled }),
        ...tagData,
      },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl1: true,
        imageUrl2: true,
        isEnabled: true,
        createdAt: true,
        tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ...product,
      tags: product.tags.map((pt) => pt.tag.name),
    });
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
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

    const activeCampaigns = await prisma.campaignProduct.findMany({
      where: {
        productId: id,
        campaign: { status: "active" },
      },
    });

    if (activeCampaigns.length > 0) {
      return NextResponse.json(
        { error: "Product is in use by active campaigns" },
        { status: 400 }
      );
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
