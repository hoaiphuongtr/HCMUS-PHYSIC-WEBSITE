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
  // When true, clicking the highlighted element itself advances the tour to the
  // next step (the user's real action drives it — no "Next" click needed). The
  // next step's preAction is skipped since the user already performed the action.
  advanceOnClick?: boolean;
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
          vi: "Bấm nút <b>New</b> để mở hộp thoại tạo layout; hướng dẫn sẽ tự chuyển bước khi bạn bấm.",
          en: "Click <b>New</b> to open the create-layout dialog; the guide advances when you do.",
        },
        side: "bottom",
        advanceOnClick: true,
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
        advanceOnClick: true,
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
  {
    id: "find-posts",
    route: "/admin/posts/list",
    label: { vi: "Tìm và lọc bài đăng", en: "Find and filter posts" },
    summary: {
      vi: "Tìm nhanh bài theo từ khoá và tạo bài mới.",
      en: "Search posts by keyword and create a new one.",
    },
    steps: [
      {
        route: "/admin/posts/list",
        selector: '[data-tour="post-search"]',
        title: { vi: "Bước 1 — Tìm kiếm", en: "Step 1 — Search" },
        body: {
          vi: "Gõ <b>tiêu đề, slug hoặc mô tả</b> để lọc nhanh danh sách bài đăng. Dùng các ô lọc bên cạnh để lọc theo danh mục và trạng thái.",
          en: "Type a <b>title, slug or description</b> to filter the list. Use the selectors beside it to filter by category and status.",
        },
        side: "bottom",
      },
      {
        selector: '[data-tour="post-new"]',
        title: { vi: "Bước 2 — Tạo bài mới", en: "Step 2 — New post" },
        body: {
          vi: "Không tìm thấy bài cần sửa? Bấm <b>Tạo bài đăng mới</b> để soạn một bài từ đầu.",
          en: "Can't find the post you need? Click <b>New post</b> to write one from scratch.",
        },
        side: "left",
      },
    ],
  },
  {
    id: "change-password",
    route: "/admin/settings",
    label: { vi: "Đổi mật khẩu tài khoản", en: "Change your password" },
    summary: {
      vi: "Cập nhật mật khẩu đăng nhập trong trang Cài đặt.",
      en: "Update your login password in Settings.",
    },
    steps: [
      {
        route: "/admin/settings",
        selector: '[data-tour="settings-password"]',
        title: { vi: "Đổi mật khẩu", en: "Change password" },
        body: {
          vi: "Nhập <b>mật khẩu hiện tại</b>, rồi <b>mật khẩu mới</b> (tối thiểu 6 ký tự) và xác nhận, sau đó bấm lưu. Cùng trang này bạn cũng cập nhật được hồ sơ cá nhân.",
          en: "Enter your <b>current password</b>, then a <b>new password</b> (min 6 chars) and confirm, then save. You can also update your profile on this page.",
        },
        side: "top",
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
  {
    q: {
      vi: "Nhập nội dung song ngữ (Tiếng Việt / Tiếng Anh) thế nào?",
      en: "How do I enter bilingual (VI/EN) content?",
    },
    steps: [
      {
        vi: "Trong trình soạn bài, mỗi ô tiêu đề và thân bài có hai thẻ VI và EN.",
        en: "In the post editor, the title and body fields each have VI and EN tabs.",
      },
      {
        vi: "Nhập bản Tiếng Việt ở thẻ VI, bản Tiếng Anh ở thẻ EN.",
        en: "Type the Vietnamese text on the VI tab, the English text on the EN tab.",
      },
      {
        vi: "Nếu để trống thẻ EN, trang công khai sẽ tự hiển thị bản Tiếng Việt.",
        en: "If the EN tab is empty, the public site falls back to Vietnamese.",
      },
    ],
  },
  {
    q: {
      vi: "Khôi phục một phiên bản cũ của trang (layout)?",
      en: "How do I restore an older version of a page (layout)?",
    },
    steps: [
      {
        vi: "Mở layout trong trình chỉnh sửa, vào mục Lịch sử phiên bản.",
        en: "Open the layout in the editor and go to Version history.",
      },
      {
        vi: "Chọn phiên bản muốn khôi phục để xem lại nội dung.",
        en: "Pick the version you want to restore to preview it.",
      },
      {
        vi: "Khôi phục về bản nháp để chỉnh tiếp, hoặc khôi phục và xuất bản lại ngay.",
        en: "Restore it as a draft to keep editing, or restore and re-publish immediately.",
      },
    ],
  },
  {
    q: {
      vi: "Cấp tài khoản cho quản trị viên một bộ môn?",
      en: "How do I create an account for a department admin?",
    },
    steps: [
      {
        vi: "Chỉ super-admin thực hiện được, trong mục Quản lý Admin.",
        en: "Only a super-admin can do this, in Admin Management.",
      },
      {
        vi: "Tạo tài khoản mới và gán đúng bộ môn cho người dùng.",
        en: "Create the account and assign the correct department to the user.",
      },
      {
        vi: "Quản trị viên bộ môn chỉ thao tác được trên nội dung của bộ môn mình.",
        en: "A department admin can only manage content belonging to their department.",
      },
    ],
  },
  {
    q: {
      vi: "Đổi mật khẩu hoặc cập nhật hồ sơ ở đâu?",
      en: "Where do I change my password or update my profile?",
    },
    steps: [
      {
        vi: "Vào mục Cài đặt (biểu tượng ở thanh điều hướng).",
        en: "Open Settings (icon in the navigation bar).",
      },
      {
        vi: "Cập nhật họ tên, chức danh, ảnh đại diện ở phần Hồ sơ.",
        en: "Update your name, title and avatar in the Profile section.",
      },
      {
        vi: "Đổi mật khẩu ở phần Bảo mật: nhập mật khẩu hiện tại và mật khẩu mới.",
        en: "Change your password in the Security section: enter the current and the new password.",
      },
    ],
  },
];
