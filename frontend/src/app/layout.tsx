import type { Metadata } from "next";
import { ToastContainer } from "react-toastify";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmProvider } from "@/components/use-confirm";
import { QueryProvider } from "@/providers/query-provider";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "HCMUS Physics Website",
  description: "HCMUS Physics Department Website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className="antialiased"
      >
        <QueryProvider>
          <TooltipProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </TooltipProvider>
        </QueryProvider>
        <ToastContainer position="bottom-center" autoClose={3000} />
      </body>
    </html>
  );
}
