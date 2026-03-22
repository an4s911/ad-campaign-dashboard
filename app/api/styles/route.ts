import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const styles = await prisma.style.findMany({
      where: { isEnabled: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(styles);
  } catch (error) {
    console.error("Failed to fetch styles:", error);
    return NextResponse.json(
      { error: "Failed to fetch styles" },
      { status: 500 }
    );
  }
}
