import { promises as fs } from "node:fs";
import path from "node:path";

const iconPath = path.join(
  process.cwd(),
  "public",
  "apple-touch-icon-precomposed.png"
);

export async function GET() {
  try {
    const file = await fs.readFile(iconPath);
    return new Response(file, {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 204 });
  }
}
