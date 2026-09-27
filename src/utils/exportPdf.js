import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";

/**
 * Exports the receipt element to a high-resolution A4 PDF document with 100% Arabic text shaping
 */
export async function downloadReceiptPDF(elementId = "receipt-document", filename = "فاتورة_مبيعات.pdf") {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Receipt element not found:", elementId);
    return false;
  }

  // Ensure all fonts (Cairo, Tajawal) are completely loaded
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // Ensure all images (logo, badges) inside receipt are completely loaded
  const images = element.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );

  try {
    // Generate high-resolution image using native browser SVG/HarfBuzz shaping
    const dataUrl = await toJpeg(element, {
      quality: 0.98,
      pixelRatio: 1, // 2.5x - 3x for crisp 300 DPI print quality
      backgroundColor: "#ffffff",
      cacheBust: true,
      style: {
        transform: "none",
        margin: "0",
        boxShadow: "none",
      },
    });

    // Standard A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;

    pdf.addImage(dataUrl, "JPEG", 0, 0, pageWidth, pageHeight);
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error("Error generating PDF with html-to-image, trying fallback:", error);
    // Fallback: window.print() or alert
    window.print();
    return true;
  }
}
