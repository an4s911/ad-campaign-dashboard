import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "superuser") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { id } = await params;
    const style = await prisma.style.findUnique({
      where: { id },
    });

    if (!style) {
      return NextResponse.json({ error: "Style not found" }, { status: 404 });
    }

    return NextResponse.json(style);
  } catch (error) {
    console.error("Failed to fetch style:", error);
    return NextResponse.json(
      { error: "Failed to fetch style" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "superuser") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!name || !prompt) {
      return NextResponse.json(
        { error: "Name and prompt are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.style.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Style not found" }, { status: 404 });
    }

    const nameConflict = await prisma.style.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });
    if (nameConflict) {
      return NextResponse.json(
        { error: "A style with this name already exists" },
        { status: 409 }
      );
    }

    const style = await prisma.style.update({
      where: { id },
      data: {
        name,
        prompt,
      },
    });

    return NextResponse.json(style);
  } catch (error) {
    console.error("Failed to update style:", error);
    return NextResponse.json(
      { error: "Failed to update style" },
      { status: 500 }
    );
  }
}
