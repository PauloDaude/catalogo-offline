export async function validatePhoto(blob: Blob): Promise<void> {
  if (
    !["image/jpeg", "image/webp"].includes(blob.type) ||
    !blob.size ||
    blob.size > 500_000
  )
    throw new Error("Foto inválida ou muito grande");

  const signature = new Uint8Array(await blob.slice(0, 12).arrayBuffer());

  const jpeg =
    blob.type === "image/jpeg" &&
    signature[0] === 255 &&
    signature[1] === 216 &&
    signature[2] === 255;
  const webp =
    blob.type === "image/webp" &&
    signature.length >= 12 &&
    signature[0] === 82 &&
    signature[1] === 73 &&
    signature[2] === 70 &&
    signature[3] === 70 &&
    signature[8] === 87 &&
    signature[9] === 69 &&
    signature[10] === 66 &&
    signature[11] === 80;
  if (!jpeg && !webp) throw new Error("Foto inválida");

  const image = await createImageBitmap(blob);

  try {
    if (!image.width || !image.height) throw new Error("Foto inválida");
  } finally {
    image.close();
  }
}
