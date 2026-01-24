import { generateMetadata as genMeta } from "@/lib/seo";
import CreateQRFormWrapper from "@/components/create/CreateQRForm";

export const metadata = genMeta({
    title: "Create QR Code",
    description: "Generate custom dynamic QR codes for free. Add logos, colors, and track scans.",
    url: "/create",
});

export default function CreateQRPage() {
    return <CreateQRFormWrapper />;
}
