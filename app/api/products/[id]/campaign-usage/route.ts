import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const linkedCampaigns = await prisma.campaign.findMany({
      where: {
        OR: [
          { products: { some: { productId: id } } },
          { texts: { some: { productId: id } } },
        ],
      },
      select: { id: true },
    });

    return NextResponse.json({
      linkedCampaignCount: linkedCampaigns.length,
    });
  } catch (error) {
    console.error("Failed to fetch product campaign usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch product campaign usage" },
      { status: 500 }
    );
  }
}
