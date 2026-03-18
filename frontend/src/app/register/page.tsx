import type { Metadata } from "next";
import { RegisterView } from "@/views/register/register-view";

export const metadata: Metadata = {
  title: "Register – HCMUS Physics Portal",
};

export default function RegisterPage() {
  return <RegisterView />;
}
