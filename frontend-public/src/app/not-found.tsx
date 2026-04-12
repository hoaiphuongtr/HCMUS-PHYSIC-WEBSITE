export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-6">
        <h1 className="text-6xl font-black text-slate-900 mb-3">404</h1>
        <p className="text-slate-600 mb-6">Trang không tồn tại hoặc chưa được xuất bản.</p>
        <a
          href="/"
          className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Về trang chủ
        </a>
      </div>
    </div>
  );
}
