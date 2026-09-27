import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";

/**
 * Generates a high-resolution A4 PDF Blob from the receipt element
 */
export async function generateReceiptPDFBlob(elementId = "receipt-document") {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Receipt element not found:", elementId);
    return null;
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
    const dataUrl = await toJpeg(element, {
      quality: 0.98,
      pixelRatio: 1,
      backgroundColor: "#ffffff",
      cacheBust: true,
      style: {
        transform: "none",
        margin: "0",
        boxShadow: "none",
      },
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;

    pdf.addImage(dataUrl, "JPEG", 0, 0, pageWidth, pageHeight);
    return pdf.output("blob");
  } catch (error) {
    console.error("Error creating PDF blob:", error);
    return null;
  }
}

/**
 * Exports the receipt element to a high-resolution A4 PDF document with 100% Arabic text shaping
 */
export async function downloadReceiptPDF(elementId = "receipt-document", filename = "فاتورة_مبيعات.pdf") {
  const blob = await generateReceiptPDFBlob(elementId);
  if (blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    const isMobile =
      window.innerWidth <= 860 ||
      /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (isMobile) {
      window.open(url, "_blank");
    }

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      if (!isMobile) {
        URL.revokeObjectURL(url);
      }
    }, 5000);
    return true;
  }

  return false;
}

/**
 * Shares the PDF invoice directly via Web Share API or WhatsApp link
 */
export async function shareReceiptOnWhatsApp({
  invoiceNumber = "",
  customerName = "",
  grandTotal = 0,
  elementId = "receipt-document",
}) {
  const cleanName = customerName?.trim() ? `_${customerName.trim().replace(/\s+/g, "_")}` : "";
  const filename = `فاتورة_مبيعات_${invoiceNumber}${cleanName}.pdf`;

  try {
    const blob = await generateReceiptPDFBlob(elementId);
    if (blob) {
      const file = new File([blob], filename, {
        type: "application/pdf",
        lastModified: Date.now(),
      });

      // Check if browser supports sharing files (Mobile devices & modern browsers)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `فاتورة مبيعات #${invoiceNumber}`,
        });
        return true;
      }

      // Download file and open WhatsApp link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 3000);
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      console.warn("Native file share issue:", err);
    } else {
      return true; // User cancelled share sheet
    }
  }

  // Fallback: Open WhatsApp with invoice note
  const shareText = `*فاتورة مبيعات - شركة الوفاء للمستلزمات*\n\n📄 رقم الفاتورة: #${invoiceNumber}\n👤 العميل: ${customerName || "—"}\n💰 الإجمالي: ${grandTotal} ريال\n(تم تنزيل ملف الفاتورة PDF)`;
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  window.open(waUrl, "_blank");
  return true;
}
