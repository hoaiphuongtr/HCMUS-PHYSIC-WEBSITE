// Bilingual copy for the onboarding tour + Help center. Vietnamese is the
// default (audience is Vietnamese teachers); the Help panel exposes a VI/EN toggle.
import type { LocalizedString } from "@/lib/i18n";

export type Locale = "vi" | "en";

// --- first-login OVERVIEW: one step per admin sidebar tab --------------------
// Selectors match the data-tour anchors added in admin-sidebar.tsx.
export const OVERVIEW_STEPS: {
  selector: string;
  title: LocalizedString;
  body: LocalizedString;
}[] = [
  {
    selector: '[data-tour="nav:/admin"]',
    title: { vi: "Bảng điều khiển", en: "Dashboard" },
    body: {
      vi: "Trang tổng quan: thống kê nhanh và lối tắt tới các khu vực quản trị.",
      en: "Overview: quick stats and shortcuts to the admin areas.",
    },
  },
  {
    selector: '[data-tour="nav:/admin/posts/list"]',
    title: { vi: "Bài đăng của tôi", en: "My Posts" },
    body: {
      vi: "Nơi tạo và quản lý tin tức, sự kiện, thông báo. Bấm để xem danh sách bài đăng.",
      en: "Create and manage news, events and notices here.",
    },
  },
  {
    selector: '[data-tour="nav:/admin/media"]',
    title: { vi: "Thư viện ảnh", en: "Media Library" },
    body: {
      vi: "Tải lên và quản lý hình ảnh dùng cho bài đăng và trang.",
      en: "Upload and manage images used across posts and pages.",
    },
  },
  {
    selector: '[data-tour="nav:/admin/widgets-layout"]',
    title: { vi: "Bố cục trang (Layout)", en: "Page Layouts" },
    body: {
      vi: "Dựng và chỉnh sửa các trang bằng trình kéo-thả. Đây là nơi bạn xuất bản/lên lịch trang.",
      en: "Build and edit pages with the drag-and-drop editor; publish/schedule here.",
    },
  },
  {
    selector: '[data-tour="nav:/admin/widgets"]',
    title: { vi: "Loại widget", en: "Widget Types" },
    body: {
      vi: "Danh mục các khối (widget) có thể dùng trong trình dựng trang.",
      en: "The catalogue of blocks available in the page builder.",
    },
  },
  {
    selector: '[data-tour="nav:/admin/subscriptions"]',
    title: { vi: "Người đăng ký", en: "Subscribers" },
    body: {
      vi: "Danh sách email đã đăng ký nhận thông báo theo chủ đề.",
      en: "Emails subscribed to topic notifications.",
    },
  },
  {
    selector: '[data-tour="nav:/admin/settings"]',
    title: { vi: "Cài đặt", en: "Settings" },
    body: {
      vi: "Hồ sơ cá nhân, đổi mật khẩu và tuỳ chọn tài khoản.",
      en: "Your profile, password and account preferences.",
    },
  },
];

// --- interactive WALKTHROUGHS ------------------------------------------------
export type WalkStep = {
  route?: string; // admin route to navigate to before this step
  selector: string; // element to highlight
  title: LocalizedString;
  body: LocalizedString;
  side?: "top" | "right" | "bottom" | "left";
  waitMs?: number; // how long to wait for the element (route change / portal)
  preAction?: () => void; // e.g. open a menu so its item mounts
};

export type Walkthrough = {
  id: string;
  route?: string;
  label: LocalizedString;
  summary: LocalizedString;
  steps: WalkStep[];
};

const clickMoreSaveOptions = () => {
  const btn = document.querySelector<HTMLElement>(
    '[aria-label="More save options"]',
  );
  btn?.click();
};

export const WALKTHROUGHS: Walkthrough[] = [
  {
    id: "create-layout",
    route: "/admin/widgets-layout",
    label: { vi: "Tạo một trang (layout) mới", en: "Create a new page (layout)" },
    summary: {
      vi: "Hướng dẫn tạo một layout mới từ đầu.",
      en: "Walk through creating a new layout from scratch.",
    },
    steps: [
      {
        route: "/admin/widgets-layout",
        selector: '[data-tour="new-layout"]',
        title: { vi: "Bước 1 — Tạo mới", en: "Step 1 — New" },
        body: {
          vi: "Bấm nút <b>New</b> để mở hộp thoại tạo layout. (Bấm Tiếp để tôi mở giúp bạn.)",
          en: "Click <b>New</b> to open the create-layout dialog. (Press Next and I'll open it.)",
        },
        side: "bottom",
      },
      {
        selector: '[data-tour="layout-name"]',
        title: { vi: "Bước 2 — Đặt tên", en: "Step 2 — Name it" },
        body: {
          vi: "Nhập <b>Tên</b> layout. Đường dẫn (slug) sẽ tự gợi ý — bạn có thể sửa.",
          en: "Enter the layout <b>Name</b>. The slug is suggested automatically — editable.",
        },
        side: "bottom",
        preAction: () => {
          document.querySelector<HTMLElement>('[data-tour="new-layout"]')?.click();
        },
        waitMs: 4000,
      },
      {
        selector: '[data-tour="layout-create"]',
        title: { vi: "Bước 3 — Tạo", en: "Step 3 — Create" },
        body: {
          vi: "Bấm <b>Create</b>. Layout sẽ mở ra trong trình kéo-thả để bạn thêm nội dung.",
          en: "Click <b>Create</b>. The layout opens in the drag-and-drop editor.",
        },
        side: "top",
      },
    ],
  },
  {
    id: "publish-schedule",
    route: "/admin/widgets-layout",
    label: { vi: "Xuất bản / Lên lịch một layout", en: "Publish / schedule a layout" },
    summary: {
      vi: "Cách lưu nháp, lên lịch, hoặc xuất bản ngay.",
      en: "How to save a draft, schedule, or publish now.",
    },
    steps: [
      {
        route: "/admin/widgets-layout",
        selector: '[data-tour="layout-picker"]',
        title: { vi: "Bước 1 — Mở một layout", en: "Step 1 — Open a layout" },
        body: {
          vi: "Chọn một layout ở đây để mở trình chỉnh sửa, rồi bấm Tiếp.",
          en: "Pick a layout here to open the editor, then press Next.",
        },
        side: "bottom",
      },
      {
        selector: '[data-tour="save-primary"]',
        title: { vi: "Bước 2 — Nút Lưu", en: "Step 2 — Save button" },
        body: {
          vi: "Đây là nút <b>Save</b>. Bấm mũi tên bên cạnh để xem thêm tuỳ chọn.",
          en: "This is <b>Save</b>. Click the caret beside it for more options.",
        },
        side: "bottom",
        waitMs: 12000,
      },
      {
        selector: '[data-tour="save-schedule"]',
        title: { vi: "Bước 3 — Lưu & lên lịch", en: "Step 3 — Save & schedule" },
        body: {
          vi: "<b>Save &amp; schedule…</b>: chọn ngày giờ để trang tự động xuất bản sau.",
          en: "<b>Save &amp; schedule…</b>: pick a date/time to auto-publish later.",
        },
        side: "left",
        preAction: clickMoreSaveOptions,
        waitMs: 4000,
      },
      {
        selector: '[data-tour="save-publish"]',
        title: { vi: "Bước 4 — Đăng ngay", en: "Step 4 — Publish now" },
        body: {
          vi: "<b>Save &amp; publish now</b>: xuất bản trang ra site công khai ngay lập tức.",
          en: "<b>Save &amp; publish now</b>: publish to the public site immediately.",
        },
        side: "left",
        preAction: clickMoreSaveOptions,
      },
    ],
  },
  {
    id: "create-post",
    route: "/admin/posts/new",
    label: { vi: "Tạo một bài đăng", en: "Create a post" },
    summary: {
      vi: "Nhập tiêu đề, danh mục, trạng thái rồi lưu.",
      en: "Fill in title, category, status, then save.",
    },
    steps: [
      {
        route: "/admin/posts/new",
        selector: "#post-title",
        title: { vi: "Tiêu đề", en: "Title" },
        body: {
          vi: "Nhập <b>tiêu đề</b> bài đăng (có tab VI/EN cho song ngữ).",
          en: "Enter the post <b>title</b> (VI/EN tabs for bilingual).",
        },
        side: "bottom",
      },
      {
        selector: "#post-category",
        title: { vi: "Danh mục", en: "Category" },
        body: {
          vi: "Chọn <b>danh mục</b> (Tin giáo vụ, Thông tin khoa học, …).",
          en: "Pick a <b>category</b>.",
        },
        side: "bottom",
      },
      {
        selector: "#post-status",
        title: { vi: "Trạng thái", en: "Status" },
        body: {
          vi: "Chọn <b>trạng thái</b>: Nháp, Chờ duyệt, Lên lịch, hoặc Xuất bản.",
          en: "Choose the <b>status</b>: Draft, Pending, Scheduled or Published.",
        },
        side: "bottom",
      },
      {
        selector: '[data-tour="post-save"]',
        title: { vi: "Lưu bài đăng", en: "Save the post" },
        body: {
          vi: "Bấm để <b>lưu</b>. Nếu chọn 'Lên lịch', bạn sẽ nhập ngày giờ xuất bản.",
          en: "Click to <b>save</b>. If 'Scheduled', you'll pick a publish time.",
        },
        side: "bottom",
      },
    ],
  },
  {
    id: "upload-media",
    route: "/admin/media",
    label: { vi: "Tải ảnh lên thư viện", en: "Upload an image" },
    summary: {
      vi: "Cách tải ảnh từ máy vào Thư viện ảnh.",
      en: "How to upload an image into the Media Library.",
    },
    steps: [
      {
        route: "/admin/media",
        selector: '[data-tour="media-upload"]',
        title: { vi: "Tải ảnh lên", en: "Upload" },
        body: {
          vi: "Kéo-thả ảnh vào vùng này, hoặc bấm <b>chọn từ máy</b>. Hỗ trợ JPG/PNG/WebP/GIF, tối đa 10MB.",
          en: "Drag images here, or click <b>choose from computer</b>. JPG/PNG/WebP/GIF, max 10MB.",
        },
        side: "bottom",
      },
    ],
  },
];

// --- Doc FAQ (pre-written issues + resolution steps) -------------------------
export type FaqItem = {
  q: LocalizedString;
  steps: LocalizedString[];
};

export const FAQ: FaqItem[] = [
  {
    q: {
      vi: "Trang tôi vừa tạo không hiện ngoài site công khai?",
      en: "My new page doesn't show on the public site?",
    },
    steps: [
      { vi: "Mở layout trong trình chỉnh sửa.", en: "Open the layout in the editor." },
      {
        vi: "Bấm mũi tên cạnh nút Save → chọn 'Save & publish now'.",
        en: "Click the caret next to Save → 'Save & publish now'.",
      },
      {
        vi: "Chờ 1-2 phút để trang công khai cập nhật (bộ nhớ đệm).",
        en: "Wait 1–2 minutes for the public cache to refresh.",
      },
    ],
  },
  {
    q: { vi: "Làm sao để lên lịch xuất bản?", en: "How do I schedule publishing?" },
    steps: [
      {
        vi: "Trong trình chỉnh sửa layout: mũi tên cạnh Save → 'Save & schedule…'.",
        en: "In the layout editor: caret next to Save → 'Save & schedule…'.",
      },
      { vi: "Chọn ngày giờ rồi bấm 'Schedule'.", en: "Pick a date/time and click 'Schedule'." },
      {
        vi: "Với bài đăng: đặt Trạng thái = 'Lên lịch' rồi nhập thời gian.",
        en: "For posts: set Status = 'Scheduled' and enter the time.",
      },
    ],
  },
  {
    q: { vi: "Ảnh trong bài không hiển thị?", en: "Images in my content aren't showing?" },
    steps: [
      {
        vi: "Kiểm tra ảnh đã được tải lên trong Thư viện ảnh chưa.",
        en: "Check the image was uploaded to the Media Library.",
      },
      {
        vi: "Dùng nút 'Chọn từ thư viện' thay vì dán URL ngoài.",
        en: "Use 'Choose from library' instead of pasting an external URL.",
      },
    ],
  },
  {
    q: { vi: "Tôi không đăng nhập được?", en: "I can't log in?" },
    steps: [
      { vi: "Kiểm tra email và mật khẩu.", en: "Check your email and password." },
      {
        vi: "Nếu quên mật khẩu, dùng 'Quên mật khẩu' ở trang đăng nhập.",
        en: "If forgotten, use 'Forgot password' on the login page.",
      },
      {
        vi: "Nếu vẫn lỗi, nhờ super-admin đặt lại mật khẩu trong Quản lý Admin.",
        en: "Still stuck? Ask a super-admin to reset it in Admin Management.",
      },
    ],
  },
];
