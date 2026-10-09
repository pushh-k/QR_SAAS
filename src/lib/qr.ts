import QRCode from "qrcode";

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  darkColor?: string;
  lightColor?: string;
}

/**
 * Generates a high-quality PNG Base64 Data URL for a given URL.
 */
export async function generateQrPng(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    width = 512,
    margin = 2,
    errorCorrectionLevel = "H",
    darkColor = "#000000",
    lightColor = "#ffffff",
  } = options;

  return QRCode.toDataURL(text, {
    width,
    margin,
    errorCorrectionLevel,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });
}

/**
 * Generates an SVG string representation of the QR code.
 */
export async function generateQrSvg(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    width = 512,
    margin = 2,
    errorCorrectionLevel = "H",
    darkColor = "#000000",
    lightColor = "#ffffff",
  } = options;

  return QRCode.toString(text, {
    type: "svg",
    width,
    margin,
    errorCorrectionLevel,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });
}
