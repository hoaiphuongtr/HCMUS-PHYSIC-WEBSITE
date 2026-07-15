// Chuẩn hóa src ảnh trong dữ liệu widget (puckData): giá trị có thể là đường dẫn
// tương đối /uploads/... (kho media của hệ thống) hoặc URL tuyệt đối bên ngoài.
// - resolveMediaSrc: cho <img> thô — trình duyệt cần origin công khai của máy chủ API.
// - resolveOptimizerSrc: cho next/image — CHÍNH máy chủ Next fetch ảnh; trên host NAT
//   không hairpin nó không tự với tới IP công khai nên đổi sang origin nội bộ đã bake
//   (NEXT_PUBLIC_IMAGE_FETCH_ORIGIN, vd http://backend:3001). Trình duyệt không bao giờ
//   gọi trực tiếp origin này.
const PUBLIC_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const FETCH_ORIGIN = process.env.NEXT_PUBLIC_IMAGE_FETCH_ORIGIN;

export const resolveMediaSrc = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith("/uploads/")) return `${PUBLIC_API}${url}`;
  return url;
};

export const resolveOptimizerSrc = (url: string | null | undefined): string => {
  const abs = resolveMediaSrc(url);
  if (FETCH_ORIGIN && abs.startsWith(PUBLIC_API)) {
    return FETCH_ORIGIN + abs.slice(PUBLIC_API.length);
  }
  return abs;
};
