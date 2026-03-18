import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const VALID_STATUSES = ["draft", "active", "disabled"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Failed to update campaign status:", error);
    return NextResponse.json(
      { error: "Failed to update campaign status" },
      { status: 500 }
    );
  }
}
