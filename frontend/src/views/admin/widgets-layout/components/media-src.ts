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

// Chuyển một URL "chia sẻ" thông thường thành URL NHÚNG (embed) để đặt vào <iframe>.
// Hỗ trợ: YouTube, Vimeo, Google Drive (video + PDF), Google Docs/Slides/Sheets,
// OneDrive/SharePoint, và PDF/tệp tải lên. URL đã ở dạng embed/preview thì giữ nguyên.
export const toEmbedUrl = (raw: string | null | undefined): string => {
  if (!raw) return "";
  const url = raw.trim();

  // YouTube: watch?v= / youtu.be/ / embed/ / shorts/
  const yt = url.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i,
  );
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;

  // Vimeo
  const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`;

  // Google Drive: /file/d/<id>/... hoặc open?id=<id>/ uc?id=<id> → /preview
  const gd =
    url.match(/drive\.google\.com\/file\/d\/([\w-]+)/i) ||
    (/drive\.google\.com/i.test(url) && url.match(/[?&]id=([\w-]+)/i));
  if (gd) return `https://drive.google.com/file/d/${gd[1]}/preview`;

  // Google Docs / Slides / Sheets / Forms → /preview (bỏ /edit, /view)
  if (/docs\.google\.com/i.test(url)) {
    return url.replace(/\/(edit|view|viewform)(\?[^#]*)?(#.*)?$/i, "/preview");
  }

  // OneDrive / SharePoint: dùng URL embed nếu đã có; nếu không cố thêm cờ embed.
  if (/1drv\.ms|onedrive\.live\.com|sharepoint\.com|-my\.sharepoint/i.test(url)) {
    if (/embed|action=embedview/i.test(url)) return url;
    if (/onedrive\.live\.com/i.test(url))
      return url.replace(/\/(redir|view)\?/i, "/embed?");
    // SharePoint/OneDrive for Business: thêm action=embedview
    return url + (url.includes("?") ? "&" : "?") + "action=embedview";
  }

  // PDF trực tiếp hoặc tệp trong kho /uploads/…
  if (/\.pdf(\?|#|$)/i.test(url) || url.startsWith("/uploads/")) {
    return resolveMediaSrc(url);
  }

  // Đã là embed/preview hoặc URL khác → giữ nguyên.
  return url;
};

// Đoán "video" (khung 16:9) hay "tài liệu" (khung cao) từ URL, để chọn tỉ lệ khung.
export const guessEmbedKind = (raw: string | null | undefined): "video" | "doc" => {
  const u = (raw || "").toLowerCase();
  if (/youtube|youtu\.be|vimeo|\.mp4|\.webm/.test(u)) return "video";
  if (/\.pdf|docs\.google|sharepoint|onedrive|1drv\.ms/.test(u)) return "doc";
  return "video";
};
