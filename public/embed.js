/**
 * QRify Embed Script
 * 
 * Usage:
 * <div id="smartqr-embed-{shortUrl}"></div>
 * <script src="https://yourdomain.com/embed.js" data-shorturl="{shortUrl}"></script>
 * 
 * Or with custom selector:
 * <script src="https://yourdomain.com/embed.js" data-shorturl="{shortUrl}" data-selector="#my-qr-container"></script>
 */

(function() {
    'use strict';

    // Get the script tag that loaded this file
    const script = document.currentScript || document.querySelector('script[data-shorturl]');
    if (!script) return;

    const shortUrl = script.getAttribute('data-shorturl');
    const selector = script.getAttribute('data-selector') || `#smartqr-embed-${shortUrl}`;
    const baseUrl = script.src.replace('/embed.js', '') || window.location.origin;

    if (!shortUrl) {
        console.error('Qrezo: data-shorturl attribute is required');
        return;
    }

    // Find the container element
    const container = document.querySelector(selector);
    if (!container) {
        console.error(`Qrezo: Container element "${selector}" not found`);
        return;
    }

    // Fetch QR code data
    fetch(`${baseUrl}/api/qr/embed/${shortUrl}`)
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                container.innerHTML = `<p style="color: #ef4444;">QR code not found</p>`;
                return;
            }

            // Create and insert QR code image
            const img = document.createElement('img');
            img.src = data.data.qrImageUrl;
            img.alt = data.data.qrName || 'QR Code';
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.margin = '0 auto';

            container.innerHTML = '';
            container.appendChild(img);
        })
        .catch(error => {
            console.error('Qrezo: Failed to load QR code', error);
            container.innerHTML = `<p style="color: #ef4444;">Failed to load QR code</p>`;
        });
})();

