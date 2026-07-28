import type { Metadata, Viewport } from "next";
import { JsonLd, organizationSchema, websiteSchema } from "@/components/JsonLd";
import ChatWidget from "@/components/ChatWidget";
import { defaultMetadata, facultyOrganization } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <JsonLd
          schema={[
            organizationSchema(),
            websiteSchema(),
            facultyOrganization(),
          ]}
        />
      </head>
      <body
        className="antialiased"
      >
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
