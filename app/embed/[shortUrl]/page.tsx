"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface QRData {
    qrImageUrl: string;
    qrName: string;
    shortUrl: string;
}

export default function EmbedQRPage() {
    const params = useParams();
    const shortUrl = params.shortUrl as string;
    const [qr, setQr] = useState<QRData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchQR() {
            try {
                const res = await fetch(`/api/qr/embed/${shortUrl}`);
                const json = await res.json();
                if (json.success) {
                    setQr(json.data);
                } else {
                    setError(json.message || "QR code not found");
                }
            } catch (err) {
                setError("Failed to load QR code");
            } finally {
                setLoading(false);
            }
        }
        if (shortUrl) {
            fetchQR();
        }
    }, [shortUrl]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !qr) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <p className="text-slate-600">{error || "QR code not found"}</p>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-white p-4">
            <div className="text-center">
                <img 
                    src={qr.qrImageUrl} 
                    alt={qr.qrName} 
                    className="mx-auto max-w-full h-auto"
                    style={{ maxWidth: "400px" }}
                />
            </div>
        </div>
    );
}





