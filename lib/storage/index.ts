import fs from "node:fs/promises";
import path from "node:path";

function resolveUploadRoot(): string {
  // On Vercel the FS is read-only except /tmp
  if (process.env.VERCEL || process.env.UPLOAD_DIR?.startsWith("/tmp")) {
    return path.join("/tmp", "jewelry-uploads");
  }
  const dir = process.env.UPLOAD_DIR || "public/uploads";
  if (path.isAbsolute(dir)) return dir;
  return path.join(/*turbopackIgnore: true*/ process.cwd(), dir);
}

export async function ensureUploadDir(...segments: string[]): Promise<string> {
  const target = path.join(resolveUploadRoot(), ...segments);
  await fs.mkdir(target, { recursive: true });
  return target;
}

/**
 * Persist a buffer. Returns a public path when writing under public/uploads,
 * otherwise a data URL so serverless environments still return usable content.
 */
export async function saveBuffer(
  relativePath: string,
  data: Buffer,
  mimeType = "application/octet-stream",
): Promise<string> {
  try {
    const root = resolveUploadRoot();
    const absolute = path.join(root, relativePath);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, data);

    if (root.includes(`${path.sep}public${path.sep}uploads`) || root.endsWith(`${path.sep}public${path.sep}uploads`)) {
      return `/uploads/${relativePath.replace(/\\/g, "/")}`;
    }

    // /tmp files are not publicly served — return data URL for PDF/preview use
    return `data:${mimeType};base64,${data.toString("base64")}`;
  } catch (error) {
    console.error("[storage] saveBuffer failed, falling back to data URL", error);
    return `data:${mimeType};base64,${data.toString("base64")}`;
  }
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
  const mime =
    match[1] === "jpeg"
      ? "image/jpeg"
      : match[1] === "webp"
        ? "image/webp"
        : "image/png";
  const buffer = Buffer.from(match[2], "base64");
  return saveBuffer(`${relativePathWithoutExt}.${ext}`, buffer, mime);
}

export async function readUploadFile(
  publicPath: string,
): Promise<Buffer | null> {
  if (publicPath.startsWith("data:")) {
    const match = /^data:[^;]+;base64,(.+)$/.exec(publicPath);
    if (!match) return null;
    return Buffer.from(match[1], "base64");
  }
  if (!publicPath.startsWith("/uploads/")) return null;
  const relative = publicPath.replace(/^\/uploads\//, "");
  const absolute = path.join(/*turbopackIgnore: true*/ resolveUploadRoot(), relative);
  try {
    return await fs.readFile(absolute);
  } catch {
    return null;
  }
}
