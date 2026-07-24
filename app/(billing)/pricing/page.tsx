import { generateMetadata as genMeta } from "@/lib/seo";
import PricingContent from "@/components/billing/PricingContent";

export const metadata = genMeta({
    title: "Pricing Plans",
    description: "Affordable pricing plans for businesses of all sizes. Free forever plan included.",
    url: "/pricing",
});

export default function PricingPage() {
    return <PricingContent />;
}
