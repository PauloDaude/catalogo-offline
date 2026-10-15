export async function validatePhoto(blob: Blob): Promise<void> {
  if (blob.type !== "image/jpeg" || !blob.size || blob.size > 500_000)
    throw new Error("Foto inválida ou muito grande");

  const signature = new Uint8Array(await blob.slice(0, 3).arrayBuffer());

  if (signature[0] !== 255 || signature[1] !== 216 || signature[2] !== 255)
    throw new Error("Foto inválida");

  const image = await createImageBitmap(blob);

  try {
    if (!image.width || !image.height) throw new Error("Foto inválida");
  } finally {
    image.close();
  }
}
