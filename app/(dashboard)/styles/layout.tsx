import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function StylesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "superuser") notFound();

  return children;
}
