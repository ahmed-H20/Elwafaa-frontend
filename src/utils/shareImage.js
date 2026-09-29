import { toJpeg } from "html-to-image";
import html2canvas from "html2canvas";

/**
 * Generates a high-resolution JPG image Blob from the receipt element
 *
 * @param {string} elementId - DOM ID of the receipt element (default "receipt-document")
 * @returns {Promise<Blob|null>}
 */
export async function generateReceiptImageBlob(elementId = "receipt-document") {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error("Receipt element not found:", elementId);
    return null;
  }

  // 1. Wait for web fonts to load
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn("Font loading wait error:", e);
    }
  }

  // 2. Wait for images inside the element to load
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

  // 3. Primary approach: html-to-image (fast, high fidelity)
  try {
    const dataUrl = await toJpeg(element, {
      quality: 0.95,
      pixelRatio: 2, // Retina 2x scale for sharp text & logos
      backgroundColor: "#ffffff",
      cacheBust: true,
      style: {
        transform: "none",
        margin: "0",
        boxShadow: "none",
      },
    });

    const response = await fetch(dataUrl);
    return await response.blob();
  } catch (error) {
    console.warn("toJpeg failed, attempting html2canvas fallback:", error);
  }

  // 4. Secondary fallback: html2canvas
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    return await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.95);
    });
  } catch (canvasErr) {
    console.error("All image generation strategies failed:", canvasErr);
    return null;
  }
}

/**
 * Downloads the receipt directly as a JPG image
 *
 * @param {string} elementId
 * @param {string} filename
 * @returns {Promise<boolean>}
 */
export async function downloadReceiptImage(
  elementId = "receipt-document",
  filename = "فاتورة_مبيعات.jpg"
) {
  const blob = await generateReceiptImageBlob(elementId);
  if (!blob) return false;

  const isMobile =
    /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  const url = URL.createObjectURL(blob);

  if (isMobile) {
    // Open image in a new tab on mobile so user can long-press to save
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } else {
    downloadBlobFile(blob, filename);
  }

  return true;
}

/**
 * Shares the invoice as a JPG PHOTO directly to WhatsApp (or via Web Share API)
 *
 * - On Mobile (Android/iOS): Invokes native share with the JPG image file,
 *   letting user send the photo directly to any WhatsApp chat/group.
 * - On Desktop: Automatically downloads the JPG photo and opens WhatsApp Web with the invoice text.
 *
 * @param {Object} options
 * @param {string} [options.invoiceNumber]
 * @param {string} [options.customerName]
 * @param {number} [options.grandTotal]
 * @param {string} [options.elementId="receipt-document"]
 * @returns {Promise<boolean>}
 */
export async function shareReceiptImage({
  invoiceNumber = "",
  customerName = "",
  grandTotal = 0,
  elementId = "receipt-document",
}) {
  const cleanName = customerName?.trim()
    ? `_${customerName.trim().replace(/\s+/g, "_")}`
    : "";
  const filename = `فاتورة_مبيعات_${invoiceNumber || "1"}${cleanName}.jpg`;

  const totalStr =
    grandTotal !== undefined && grandTotal !== null
      ? Number(grandTotal).toFixed(2)
      : "";

  const shareText = `*فاتورة مبيعات - شركة الوفاء للمستلزمات*\n\n📄 رقم الفاتورة: #${invoiceNumber || "1"}\n👤 العميل: ${customerName || "—"}${totalStr ? `\n💰 الإجمالي: ${totalStr} ريال` : ""}`;

  try {
    const blob = await generateReceiptImageBlob(elementId);

    if (!blob) {
      console.warn("Image blob generation failed, opening WhatsApp with text");
      openWhatsAppText(shareText);
      return false;
    }

    const file = new File([blob], filename, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    // Mobile Web Share API with files (Android Chrome, iOS Safari)
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: `فاتورة مبيعات #${invoiceNumber}`,
        text: shareText,
      });
      return true;
    }

    // Desktop or unsupported fallback:
    // 1) Download image for user to drag/attach
    downloadBlobFile(blob, filename);

    // 2) Open WhatsApp Web with text
    openWhatsAppText(shareText);
    return true;
  } catch (err) {
    if (err.name === "AbortError") {
      return true; // User dismissed share dialog
    }
    console.error("Image sharing failed, opening WhatsApp with text:", err);
    openWhatsAppText(shareText);
    return false;
  }
}

function openWhatsAppText(text) {
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(waUrl, "_blank");
}

function downloadBlobFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 4000);
}