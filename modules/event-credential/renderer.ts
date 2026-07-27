import QRCodeLib from "qrcode";

/**
 * Pure QR renderer — never generates tokens.
 * Callers supply opaque payload content only.
 */
export async function renderCredentialPng(
    content: string,
    size = 512
): Promise<Buffer> {
    return QRCodeLib.toBuffer(content, {
        type: "png",
        width: size,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#0f172a", light: "#ffffff" },
    });
}

export async function renderCredentialSvg(content: string): Promise<string> {
    return QRCodeLib.toString(content, {
        type: "svg",
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#0f172a", light: "#ffffff" },
    });
}
