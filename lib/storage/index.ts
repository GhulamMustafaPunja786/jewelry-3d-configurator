import fs from "node:fs/promises";
import path from "node:path";

function resolveUploadRoot(): string {
  const dir = process.env.UPLOAD_DIR || "public/uploads";
  if (path.isAbsolute(dir)) return dir;
  return path.join(/*turbopackIgnore: true*/ process.cwd(), dir);
}

export async function ensureUploadDir(...segments: string[]): Promise<string> {
  const target = path.join(resolveUploadRoot(), ...segments);
  await fs.mkdir(target, { recursive: true });
  return target;
}

export async function saveBuffer(
  relativePath: string,
  data: Buffer,
): Promise<string> {
  const absolute = path.join(resolveUploadRoot(), relativePath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, data);
  return `/uploads/${relativePath.replace(/\\/g, "/")}`;
}

export async function saveDataUrlImage(
  relativePathWithoutExt: string,
  dataUrl: string,
): Promise<string> {
  const match = /^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Invalid data URL");
  }
  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  const buffer = Buffer.from(match[2], "base64");
  return saveBuffer(`${relativePathWithoutExt}.${ext}`, buffer);
}

export async function readUploadFile(
  publicPath: string,
): Promise<Buffer | null> {
  if (!publicPath.startsWith("/uploads/")) return null;
  const relative = publicPath.replace(/^\/uploads\//, "");
  const absolute = path.join(resolveUploadRoot(), relative);
  try {
    return await fs.readFile(absolute);
  } catch {
    return null;
  }
}
