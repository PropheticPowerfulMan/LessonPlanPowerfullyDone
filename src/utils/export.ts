import html2pdf from "html2pdf.js";

export const exportElementToPdf = async (element: HTMLElement, filename: string) => {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = "fixed";
  clone.style.left = "0";
  clone.style.top = "0";
  clone.style.width = "297mm";
  clone.style.height = "210mm";
  clone.style.opacity = "1";
  clone.style.pointerEvents = "none";
  clone.style.zIndex = "2147483647";
  clone.style.transform = "translateX(-120vw)";
  clone.style.background = "#ffffff";
  document.body.appendChild(clone);
  try {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await html2pdf()
      .set({
        margin: 0,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        pagebreak: { mode: ["css", "legacy"], avoid: [".print-header", "tr", ".signature-block"] },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
      })
      .from(clone)
      .save();
  } finally {
    clone.remove();
  }
};

export const exportElementToDocx = (element: HTMLElement, filename: string) => {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${filename}</title></head><body>${element.outerHTML}</body></html>`;
  const blob = new Blob([html], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
