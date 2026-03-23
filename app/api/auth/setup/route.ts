import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return NextResponse.json(
      { error: "Setup already completed" },
      { status: 403 }
    );
  }

  const superPassword = process.env.SUPER_PASSWORD;
  if (!superPassword) {
    return NextResponse.json(
      { error: "SUPER_PASSWORD environment variable is not set" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { fullName, username, email } = body;

  if (!fullName || !username) {
    return NextResponse.json(
      { error: "Full name and username are required" },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3-30 characters: lowercase letters, numbers, underscores" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(superPassword);
  const now = new Date();

  await prisma.user.create({
    data: {
      fullName,
      username,
      email: email || null,
      passwordHash,
      role: "superuser",
      isActive: true,
      passwordChangedAt: now,
      createdAt: now,
    },
  });

  return NextResponse.json({ success: true });
}
