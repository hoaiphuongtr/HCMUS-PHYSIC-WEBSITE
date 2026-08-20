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
  // Bỏ bước "Loại widget": mục /admin/widgets đã được ẩn khỏi thanh điều hướng
  // (xem admin-sidebar.tsx), nên bước này chỉ dẫn người dùng tới một menu không
  // còn tồn tại. Tour tự lọc phần tử không có nên trước đây nó âm thầm bị bỏ qua.
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
    label: {
      vi: "Tạo một trang (layout) mới",
      en: "Create a new page (layout)",
    },
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
          document
            .querySelector<HTMLElement>('[data-tour="new-layout"]')
            ?.click();
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
    label: {
      vi: "Xuất bản / Lên lịch một layout",
      en: "Publish / schedule a layout",
    },
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
        title: {
          vi: "Bước 3 — Lưu & lên lịch",
          en: "Step 3 — Save & schedule",
        },
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
    route: "/admin/posts",
    label: { vi: "Đăng một bài mới", en: "Publish a new post" },
    summary: {
      vi: "Chọn loại bài → nhập nội dung → bấm một trong ba nút lưu.",
      en: "Pick the kind, write, then use one of the three save buttons.",
    },
    steps: [
      {
        route: "/admin/posts",
        selector: "#post-kind-modal",
        title: { vi: "Chọn loại bài", en: "Choose the kind" },
        body: {
          vi: "Trước khi vào trình soạn, hệ thống hỏi bạn đăng <b>Tin tức</b> hay <b>Sự kiện</b>. Chọn xong nó tự gắn đúng mẫu trang, bạn không phải chọn layout nữa.",
          en: "Before the editor opens you pick <b>News</b> or <b>Event</b>. The matching page template is attached automatically — no layout picking.",
        },
        side: "bottom",
      },
      {
        selector: "#post-title",
        title: { vi: "Tiêu đề", en: "Title" },
        body: {
          vi: "Nhập <b>tiêu đề</b>. Hai tab Tiếng Việt / English ngay bên cạnh để nhập bản song ngữ.",
          en: "Enter the <b>title</b>. The VI / English tabs next to it hold the bilingual version.",
        },
        side: "bottom",
      },
      {
        selector: "#post-category",
        title: { vi: "Danh mục", en: "Categories" },
        body: {
          vi: "Chỉ có với Tin tức, và <b>chọn được nhiều danh mục</b>: bài sẽ hiện dưới mọi danh mục đã chọn mà vẫn chỉ một đường dẫn. Sửa bài cũ thì các danh mục đã chọn được điền sẵn, bấm lại để bỏ.",
          en: "News only, and you can <b>pick several</b>: the post appears under every chosen category while keeping one URL. When editing, existing categories are pre-filled; click one to remove it.",
        },
        side: "bottom",
      },
      {
        selector: '[data-tour="post-save"]',
        title: { vi: "Ba nút lưu", en: "Three save buttons" },
        body: {
          vi: "<b>Lưu</b> giữ nguyên trạng thái (bài đang xuất bản vẫn xuất bản, nội dung mới nằm ở bản nháp). <b>Lưu và lên lịch</b> hẹn giờ — trang công khai giữ nội dung cũ cho tới đúng giờ đó. <b>Lưu và xuất bản ngay</b> đưa nội dung mới lên web luôn.",
          en: "<b>Save</b> keeps the current status (a live post stays live; new content waits as a draft). <b>Save &amp; schedule</b> holds the public page on the old content until the chosen time. <b>Save &amp; publish now</b> pushes it live immediately.",
        },
        side: "bottom",
      },
      {
        selector: "#post-status",
        title: { vi: "Trạng thái bài đăng", en: "Post status" },
        body: {
          vi: "Ô này <b>chỉ để xem</b>, nằm ngang hàng với tab ngôn ngữ. Nó đi theo nút lưu bạn bấm chứ không tự chọn được nữa.",
          en: "This is <b>read-only</b>, shown next to the language tabs. It follows the save button you press.",
        },
        side: "left",
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
      {
        vi: "Mở layout trong trình chỉnh sửa.",
        en: "Open the layout in the editor.",
      },
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
    q: {
      vi: "Làm sao để lên lịch xuất bản?",
      en: "How do I schedule publishing?",
    },
    steps: [
      {
        vi: "Với bài đăng: bấm <b>Lưu và lên lịch</b>, chọn ngày giờ rồi xác nhận. Không cần chọn Trạng thái nữa — ô đó nay chỉ để xem.",
        en: "For posts: click <b>Save &amp; schedule</b>, pick the date/time and confirm. No status picker any more — that field is read-only now.",
      },
      {
        vi: "Trang công khai <b>giữ nguyên nội dung cũ</b> cho tới đúng giờ hẹn; bài vẫn nằm trong danh sách tin, không biến mất.",
        en: "The public page <b>keeps the old content</b> until that time; the post stays in the news list.",
      },
      {
        vi: "Với layout: mũi tên cạnh Save → 'Save & schedule…' rồi chọn giờ.",
        en: "For layouts: caret next to Save → 'Save & schedule…', then pick a time.",
      },
      {
        vi: "Hệ thống kiểm mỗi phút một lần nên bài lên chậm nhất khoảng một phút so với giờ hẹn.",
        en: "The scheduler runs once a minute, so publishing lands within about a minute of the chosen time.",
      },
    ],
  },
  {
    q: {
      vi: "Đăng bài xong mà trang công khai chưa đổi?",
      en: "I saved a post but the public page hasn't changed?",
    },
    steps: [
      {
        vi: "Kiểm bạn đã bấm nút nào: <b>Lưu</b> chỉ ghi bản nháp, KHÔNG đưa nội dung mới lên web.",
        en: "Check which button you pressed: <b>Save</b> only writes a draft; it does not push content live.",
      },
      {
        vi: "Muốn lên ngay thì bấm <b>Lưu và xuất bản ngay</b>.",
        en: "To go live immediately use <b>Save &amp; publish now</b>.",
      },
      {
        vi: "Nếu đang có lịch hẹn thì nội dung mới chỉ lên đúng giờ đã đặt.",
        en: "If a schedule is pending, the new content only appears at that time.",
      },
    ],
  },
  {
    q: {
      vi: "Một bài muốn hiện ở nhiều danh mục thì làm sao?",
      en: "How do I show one post under several categories?",
    },
    steps: [
      {
        vi: "Ở bài Tin tức, tick <b>nhiều danh mục</b> cùng lúc trong ô Danh mục.",
        en: "On a News post, tick <b>several categories</b> at once.",
      },
      {
        vi: "Bài chỉ có <b>một đường dẫn duy nhất</b>, nhưng lọc theo danh mục nào cũng thấy nó.",
        en: "The post keeps a <b>single URL</b> but appears under every category filter you picked.",
      },
      {
        vi: "Đường dẫn hiển thị (Trang chủ / Tin tức / …) chạy theo danh mục chính là danh mục bạn chọn đầu tiên.",
        en: "The breadcrumb follows the first category you picked.",
      },
    ],
  },
  {
    q: {
      vi: "Ảnh trong bài không hiển thị?",
      en: "Images in my content aren't showing?",
    },
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
      {
        vi: "Kiểm tra email và mật khẩu.",
        en: "Check your email and password.",
      },
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
  {
    q: {
      vi: "Bài đã xuất bản nhưng không thấy ở danh mục hay trang chủ?",
      en: "My post is published but doesn't appear in its category or on the homepage?",
    },
    steps: [
      {
        vi: "Bài phải có <b>layout đã xuất bản</b> mới hiện ra — đây là bước hay quên nhất. Xuất bản riêng bài thôi là chưa đủ.",
        en: "A post only appears once it has a <b>published layout</b> — the most commonly missed step. Publishing the post alone is not enough.",
      },
      {
        vi: "<b>Danh mục gắn trên LAYOUT</b>, không phải trên bài. Layout chưa xuất bản thì bài cũng chưa thuộc danh mục nào.",
        en: "The <b>category lives on the LAYOUT</b>, not on the post. If the layout isn't published, the post has no category yet.",
      },
      {
        vi: "Nếu bạn thuộc một <b>đơn vị</b> (Đoàn – Hội, CLB…): bài <b>cố ý không lên trang chủ</b>, chỉ hiện trong danh mục của đơn vị.",
        en: "If you belong to a <b>unit</b> (Youth Union, clubs…): posts are <b>intentionally kept off the homepage</b> and appear only in the unit's category.",
      },
      {
        vi: "Đơn vị đó phải được đánh dấu phân loại là <b>Đơn vị</b> trong Danh mục &amp; Thẻ → tab Bộ môn. Để nhầm là <b>Bộ môn</b> thì bài không hiện ở đâu cả.",
        en: "That unit must be flagged as <b>Unit</b> under Categories &amp; Tags → Departments tab. Left as <b>Department</b>, the post shows up nowhere.",
      },
      {
        vi: "Làm đủ các bước trên mà vẫn chưa thấy thì chờ 1–2 phút cho bộ nhớ đệm cập nhật.",
        en: "If all of the above is done and it still doesn't show, wait 1–2 minutes for the cache to refresh.",
      },
    ],
  },
  {
    q: {
      vi: "Đăng bài với ngày trong quá khứ (bài cũ) được không?",
      en: "Can I publish a post with a past date (backdating)?",
    },
    steps: [
      {
        vi: "Được, nhưng <b>chỉ Super Admin</b>. Trong trình soạn bài sẽ thấy ô <b>Ngày đăng</b>; tài khoản khác không thấy ô này.",
        en: "Yes, but <b>Super Admin only</b>. The post composer shows a <b>Publish date</b> field; other accounts don't see it.",
      },
      {
        vi: "Chọn ngày giờ mong muốn rồi lưu và xuất bản như bình thường.",
        en: "Pick the date/time, then save and publish as usual.",
      },
      {
        vi: "Ngày này quyết định thứ tự bài trong danh sách tin, nên bài cũ sẽ nằm đúng vị trí theo thời gian thay vì nhảy lên đầu.",
        en: "This date drives the ordering in news lists, so an old post sits in its correct chronological place instead of jumping to the top.",
      },
    ],
  },
  {
    q: {
      vi: "Chèn video hoặc file PDF vào bài viết?",
      en: "How do I embed a video or PDF in an article?",
    },
    steps: [
      {
        vi: "Trong trình soạn bài, bấm biểu tượng <b>thước phim</b> trên thanh công cụ.",
        en: "In the editor toolbar, click the <b>film</b> icon.",
      },
      {
        vi: "Dán link YouTube, Google Drive hoặc OneDrive — hệ thống tự đổi sang dạng nhúng.",
        en: "Paste a YouTube, Google Drive or OneDrive link — it is converted to an embed automatically.",
      },
      {
        vi: "Với file trên Drive/OneDrive, nhớ đặt quyền chia sẻ là <b>ai có link đều xem được</b>, nếu không người ngoài sẽ thấy ô trống.",
        en: "For Drive/OneDrive files, set sharing to <b>anyone with the link</b>, otherwise visitors see an empty box.",
      },
      {
        vi: "Khung nhúng tự co theo màn hình, xem trên điện thoại vẫn vừa.",
        en: "The embed is responsive and fits phone screens automatically.",
      },
    ],
  },
  {
    q: {
      vi: "Tô màu ô bảng hoặc đổi cỡ chữ trong bài?",
      en: "How do I colour table cells or change the font size?",
    },
    steps: [
      {
        vi: "Đặt con trỏ vào ô bảng cần tô, rồi chọn màu ở nút <b>màu nền ô</b> trên thanh công cụ.",
        en: "Put the cursor in the cell, then pick a colour from the <b>cell background</b> button in the toolbar.",
      },
      {
        vi: "Bôi đen chữ rồi chọn cỡ ở ô <b>cỡ chữ</b> để phóng to hoặc thu nhỏ.",
        en: "Select the text and choose a size from the <b>font size</b> dropdown.",
      },
      {
        vi: "Muốn căn đều hai bên thì dùng nút căn lề <b>justify</b>.",
        en: "Use the <b>justify</b> alignment button for text aligned on both edges.",
      },
    ],
  },
  {
    q: {
      vi: "Ảnh của bộ môn tôi lưu ở đâu trong thư viện ảnh?",
      en: "Where are my department's images kept in the media library?",
    },
    steps: [
      {
        vi: "Thư viện ảnh có các <b>thẻ theo bộ môn</b> ở phía trên: ảnh dùng chung của Khoa và ảnh riêng từng bộ môn.",
        en: "The media library has <b>department tabs</b> at the top: faculty-wide images and each department's own.",
      },
      {
        vi: "Ảnh bạn tải lên tự vào kho của bộ môn mình, người bộ môn khác không thấy.",
        en: "Images you upload go to your own department's store; other departments don't see them.",
      },
      {
        vi: "Super Admin xem được mọi kho và chọn tải ảnh vào bộ môn bất kỳ.",
        en: "A Super Admin sees every store and can upload into any department.",
      },
    ],
  },
  {
    q: {
      vi: "Cập nhật trang hồ sơ giảng viên (nhân sự)?",
      en: "How do I update a staff profile page?",
    },
    steps: [
      {
        vi: "Vào <b>Bố cục trang</b>, tìm trang theo đường dẫn dạng <code>&lt;bộ môn&gt;/nhan-su/&lt;tên&gt;</code>.",
        en: "Open <b>Page Layouts</b> and find the page by its path, e.g. <code>&lt;department&gt;/nhan-su/&lt;name&gt;</code>.",
      },
      {
        vi: "Bấm vào khối <b>Staff Profile</b> để sửa ảnh chân dung, họ tên, chức danh, email và nội dung hồ sơ.",
        en: "Click the <b>Staff Profile</b> block to edit the portrait, name, title, email and profile content.",
      },
      {
        vi: "Ô nội dung có hai thẻ VI và EN — sửa ở thẻ nào chỉ đổi ngôn ngữ đó.",
        en: "The content field has VI and EN tabs — editing one only changes that language.",
      },
      {
        vi: "Xong bấm <b>Lưu và xuất bản ngay</b>, nếu không trang ngoài site vẫn giữ bản cũ.",
        en: "Finish with <b>Save &amp; publish now</b>, otherwise the public page keeps the old version.",
      },
    ],
  },
];
