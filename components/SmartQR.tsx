/**
 * SmartQR React Component
 * 
 * Usage:
 * import SmartQR from '@/components/SmartQR';
 * 
 * <SmartQR shortUrl="your-short-url" />
 */

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface SmartQRProps {
    shortUrl: string;
    className?: string;
    width?: number;
    height?: number;
}

export default function SmartQR({ shortUrl, className = "", width, height }: SmartQRProps) {
    const [qr, setQr] = useState<{ qrImageUrl: string; qrName: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchQR() {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
                const res = await fetch(`${baseUrl}/api/qr/embed/${shortUrl}`);
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
            <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !qr) {
        return (
            <div className={`flex items-center justify-center text-slate-500 ${className}`} style={{ width, height }}>
                <p className="text-sm">{error || "QR code not found"}</p>
            </div>
        );
    }

    return (
        <Image
            src={qr.qrImageUrl}
            alt={qr.qrName || "QR Code"}
            width={width || 400}
            height={height || 400}
            className={className}
            style={{ 
                maxWidth: "100%",
                height: "auto"
            }}
            loading="lazy"
            unoptimized={!qr.qrImageUrl.includes("cloudinary.com")}
        />
    );
}

