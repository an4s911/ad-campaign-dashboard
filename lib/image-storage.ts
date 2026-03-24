import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * Downloads an image from a URL and stores it using the same
 * strategy as the upload route: Vercel Blob in production,
 * local filesystem in development.
 *
 * Returns the publicly-accessible URL for the stored image.
 */
export async function downloadAndStoreImage(
  sourceUrl: string,
  extension: string = ".jpg"
): Promise<string> {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extension}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(uniqueName, buffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  } else {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);
    return `/uploads/${uniqueName}`;
  }
}
