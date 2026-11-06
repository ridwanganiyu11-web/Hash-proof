import QRCode from "qrcode";

/**
 * Generates a high-contrast PNG data URL for a public verification link locally in the browser.
 * Never uses any external or paid QR API.
 */
export async function generateQrCodeDataUrl(url: string): Promise<string> {
  if (!url || typeof url !== "string") {
    throw new Error("A valid verification URL is required to generate a QR code.");
  }

  return QRCode.toDataURL(url, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#070b14",
      light: "#ffffff",
    },
  });
}

/**
 * Triggers a browser download of a QR code PNG data URL.
 */
export function downloadQrCodePng(dataUrl: string, fileHash: string): void {
  const link = document.createElement("a");
  const shortHash = fileHash.slice(0, 10);
  link.href = dataUrl;
  link.download = `hashproof-verify-${shortHash}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

