import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminThemeProvider } from "@/components/admin/admin-theme";
import { HelpCenter } from "@/components/admin/help-center";
import { OnboardingTour } from "@/components/admin/onboarding-tour";
import { AuthGuard } from "@/components/auth-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard roles={["ADMIN", "SUPER_ADMIN"]}>
      <AdminThemeProvider>
        <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#101622] text-slate-900 dark:text-slate-100">
          <AdminSidebar />
          <div className="flex flex-1 flex-col h-full overflow-hidden bg-[#F8FAFC] dark:bg-[#101622]">
            {children}
          </div>
        </div>
        <OnboardingTour />
        <HelpCenter />
      </AdminThemeProvider>
    </AuthGuard>
  );
}
