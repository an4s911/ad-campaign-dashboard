import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const includeDisabled =
      request.nextUrl.searchParams.get("includeDisabled") === "true" &&
      session.role === "superuser";

    const styles = await prisma.style.findMany({
      where: includeDisabled ? undefined : { isEnabled: true },
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

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "superuser") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const previewImageUrl =
      typeof body.previewImageUrl === "string" && body.previewImageUrl.trim()
        ? body.previewImageUrl.trim()
        : null;

    if (!name || !prompt) {
      return NextResponse.json(
        { error: "Name and prompt are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.style.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: "A style with this name already exists" },
        { status: 409 }
      );
    }

    const style = await prisma.style.create({
      data: {
        name,
        prompt,
        previewImageUrl,
      },
    });

    return NextResponse.json(style, { status: 201 });
  } catch (error) {
    console.error("Failed to create style:", error);
    return NextResponse.json(
      { error: "Failed to create style" },
      { status: 500 }
    );
  }
}
