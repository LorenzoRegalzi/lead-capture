// Furniture photos: we need enough detail to spot defects, so we keep a high
// resolution and high JPEG quality. The real limit is the Vercel function
// body size (4.5MB), so we stay under MAX_BYTES.
const MAX_DIMENSION = 3072;
const QUALITIES = [0.9, 0.85, 0.8, 0.7];
const MAX_BYTES = 4 * 1024 * 1024;

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // fall back to <img> below
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const source = await loadBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(source.width, source.height));
    const width = Math.round(source.width * scale);
    const height = Math.round(source.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, width, height);
    if ("close" in source) source.close();

    let blob: Blob | null = null;
    for (const quality of QUALITIES) {
      blob = await toBlob(canvas, quality);
      if (blob && blob.size <= MAX_BYTES) break;
    }

    // free canvas memory right away (matters on mobile)
    canvas.width = 0;
    canvas.height = 0;

    // if compression didn't shrink it, keep the original
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch (err) {
    console.error("Image compression failed, using original:", err);
    return file;
  }
}
