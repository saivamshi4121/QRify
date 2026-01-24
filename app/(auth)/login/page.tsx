import { Metadata } from "next";
import LoginFormWrapper from "@/components/auth/LoginForm";

export const metadata: Metadata = {
    title: "Login | Qrezo",
    description: "Login to your Qrezo account.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function LoginPage() {
    return <LoginFormWrapper />;
}
