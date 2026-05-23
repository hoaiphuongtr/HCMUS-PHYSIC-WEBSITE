import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AuthGuard } from "@/components/auth-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard roles={["ADMIN", "SUPER_ADMIN"]}>
      <div className="flex h-screen w-full overflow-hidden">
        <AdminSidebar />
        <div className="flex flex-1 flex-col h-full overflow-hidden bg-[#F8FAFC]">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
