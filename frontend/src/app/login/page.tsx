import type { Metadata } from "next";
import { LoginView } from "@/views/login/login-view";

export const metadata: Metadata = {
  title: "Login – HCMUS Physics Portal",
};

export default function LoginPage() {
  return <LoginView />;
}
