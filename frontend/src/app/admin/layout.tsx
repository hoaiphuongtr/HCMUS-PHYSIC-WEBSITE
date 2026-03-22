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
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <AdminSidebar />
        <div className="flex flex-1 flex-col h-full overflow-hidden bg-[#F8FAFC]">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
