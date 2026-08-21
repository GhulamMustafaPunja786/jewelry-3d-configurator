/**
 * Client preview capture helpers (browser only).
 *
 * Example usage from JewelryViewer:
 *   const canvas = gl.domElement;
 *   const dataUrl = canvas.toDataURL("image/png");
 *
 * Server: persist via saveDataUrlImage() in lib/storage.
 * This module documents the contract; actual capture runs on the client.
 */

export type PreviewCaptureOptions = {
  type?: "image/png" | "image/jpeg" | "image/webp";
  quality?: number;
};

export function captureCanvasDataUrl(
  canvas: HTMLCanvasElement,
  options: PreviewCaptureOptions = {},
): string {
  const type = options.type ?? "image/png";
  if (type === "image/png") {
    return canvas.toDataURL(type);
  }
  return canvas.toDataURL(type, options.quality ?? 0.92);
}

/** Server stub — prefer saveDataUrlImage from lib/storage in API routes. */
export async function storePreviewStub(designId: string): Promise<string | null> {
  console.info("[preview] store stub for", designId);
  return null;
}
