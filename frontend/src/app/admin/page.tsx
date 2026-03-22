export default function AdminDashboardPage() {
  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-slate-200/60 bg-white px-6 shrink-0">
        <div className="text-sm text-slate-500 font-medium">
          <span className="text-slate-400">Physics Faculty</span>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-900">Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 w-56"
            />
          </div>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Welcome to the Physics Faculty Admin Portal
          </p>
        </div>
      </div>
    </>
  );
}
