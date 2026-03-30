import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
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

    const flattenedProducts = products.map((p) => ({
      ...p,
      tags: p.tags.map((pt) => pt.tag.name),
    }));

    return NextResponse.json(flattenedProducts);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, imageUrl1, imageUrl2, tags } = body;

    if (!name || !description || !imageUrl1) {
      return NextResponse.json(
        { error: "name, description, and imageUrl1 are required" },
        { status: 400 }
      );
    }

    // Process tags: get or create each one
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

    const product = await prisma.product.create({
      data: {
        name,
        description,
        imageUrl1,
        imageUrl2,
        tags: {
          create: tagIds.map((tagId) => ({
            tagId,
          })),
        },
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

    return NextResponse.json(
      {
        ...product,
        tags: product.tags.map((pt) => pt.tag.name),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
