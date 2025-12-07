import QRCodeLib from "qrcode";
import { createCanvas, loadImage } from "canvas";

interface QROptions {
    foregroundColor?: string;
    backgroundColor?: string;
    logoUrl?: string;
}

/**
 * Generate a QR code with logo and custom colors
 */
export async function generateQR(
    data: string,
    options: QROptions = {}
): Promise<Buffer> {
    const {
        foregroundColor = "#000000",
        backgroundColor = "#ffffff",
        logoUrl = null,
    } = options;

    const size = 1000; // High resolution for quality
    const margin = 4; // Proper quiet zone
    const qrSize = size - (margin * 2);

    // Step 1: Generate base QR code
    const qrOptions: any = {
        errorCorrectionLevel: "H", // High error correction for logo support
        type: "png",
        width: qrSize,
        margin: 0, // We'll add margin manually
        color: {
            dark: foregroundColor,
            light: backgroundColor,
        },
    };

    // Generate base QR as data URL
    // toDataURL returns Promise<string> when used without callback
    const qrDataUrl = await new Promise<string>((resolve, reject) => {
        QRCodeLib.toDataURL(data, qrOptions, (err, url) => {
            if (err) reject(err);
            else resolve(url);
        });
    });

    // Step 2: Load QR image and create canvas
    const qrImage = await loadImage(qrDataUrl);
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");

    // Step 3: Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);

    // Step 4: Draw QR code
    ctx.drawImage(qrImage, margin, margin, qrSize, qrSize);

    // Step 5: Add logo in the center if provided
    if (logoUrl) {
        try {
            const logo = await loadImage(logoUrl);
            // Logo size: 25% of QR code size for good visibility (matching reference proportions)
            // With H-level error correction, QR can handle up to 30% damage, so 25% is safe
            const logoSize = Math.floor(qrSize * 0.25); // ~250px for 1000px QR
            const containerPadding = 25; // Padding proportional to logo size
            
            // Calculate perfect center position
            // Center of the entire canvas (including margins)
            const centerX = size / 2;
            const centerY = size / 2;
            
            // Logo position: centered both horizontally and vertically
            const logoX = Math.floor(centerX - (logoSize / 2));
            const logoY = Math.floor(centerY - (logoSize / 2));

            // Draw background colored square behind logo (ensures QR remains scannable)
            // This creates a "quiet zone" around the logo - larger padding for better visibility
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(
                logoX - containerPadding,
                logoY - containerPadding,
                logoSize + (containerPadding * 2),
                logoSize + (containerPadding * 2)
            );

            // Draw logo perfectly centered with larger size for better visibility
            ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
            
            console.log(`[QR Generator] Logo placed at center: x=${logoX}, y=${logoY}, size=${logoSize} (25% of QR), canvas center: (${centerX}, ${centerY})`);
        } catch (error) {
            console.error("Failed to load logo:", error);
            // If logo fails, throw error so user knows
            throw new Error("Failed to load logo image. Please check the logo URL.");
        }
    }

    // Step 6: Convert to buffer
    return canvas.toBuffer("image/png");
}
