import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;

export async function renderOrderPreview(file: File): Promise<Blob> {
  const task = getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    useWasm: false,
  });
  try {
    const pdf = await task.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({
      scale: 720 / page.getViewport({ scale: 1 }).width,
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Prévia indisponível neste navegador");
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    const preview = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    page.cleanup();
    canvas.width = 0;
    canvas.height = 0;
    if (!preview) throw new Error("Não foi possível criar a prévia");
    return preview;
  } finally {
    await task.destroy();
  }
}
