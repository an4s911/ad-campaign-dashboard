import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userCount = await prisma.user.count();
  if (userCount === 0) redirect("/setup");
  redirect("/dashboard");
}
