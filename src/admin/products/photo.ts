export async function optimizePhoto(file: File): Promise<Blob> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    !file.size ||
    file.size > 20 * 1024 * 1024
  )
    throw new Error("Escolha uma foto JPEG, PNG ou WebP de até 20 MB.");

  let image: ImageBitmap;
  try {
    image = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Não foi possível abrir esta foto. Escolha outra.");
  }

  try {
    if (!image.width || !image.height) throw new Error("Foto inválida.");
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Este navegador não conseguiu preparar a foto.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (let quality = 0.9; quality >= 0.3; quality -= 0.1) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (blob && blob.size <= 500_000 && blob.size > 0) return blob;
    }
    throw new Error(
      "A foto ainda está muito grande. Escolha uma imagem menor.",
    );
  } finally {
    image.close();
  }
}
