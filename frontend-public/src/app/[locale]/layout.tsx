import { notFound } from "next/navigation";
import { ScrollToTop } from "@/components/scroll-to-top";
import { isLocale } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/locale-context";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <LocaleProvider initialLocale={locale}>
      {children}
      <ScrollToTop />
    </LocaleProvider>
  );
}
