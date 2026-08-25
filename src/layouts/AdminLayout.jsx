import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const NAV_ITEMS = [
  { to: "/admin", icon: "🏠", label: "الرئيسية", end: true },
  { to: "/admin/students", icon: "🎓", label: "إدارة الطلاب" },
  { to: "/admin/exams", icon: "📝", label: "الاختبارات" },
  { to: "/admin/exams/new", icon: "➕", label: "إنشاء اختبار" },
  { to: "/admin/results", icon: "👨‍🎓", label: "نتائج الطلاب" },
  { to: "/admin/top-students", icon: "🏆", label: "الطلاب المتفوقون" },
  { to: "/admin/settings", icon: "⚙️", label: "إعدادات المنصة" },
];

export default function AdminLayout() {
  const { signOut, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const sidebarContent = (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-navy/10 px-4">
        <h1 className="text-lg font-extrabold text-navy">🌟 منصة مس دنيا</h1>
        <button
          onClick={() => setSidebarOpen(false)}
          className="rounded-lg p-2 text-navy/60 transition-colors hover:bg-navy/5 lg:hidden"
          aria-label="إغلاق القائمة"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-navy/70 hover:bg-navy/5 hover:text-navy"
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-navy/10 p-4">
        <p className="mb-2 truncate text-xs text-navy/50">
          {session?.user?.email}
        </p>
        <button
          onClick={handleSignOut}
          className="w-full rounded-xl bg-error/10 px-4 py-2.5 text-sm font-bold text-error transition-colors hover:bg-error/20"
        >
          تسجيل الخروج 🚪
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-dvh bg-sky/40">
      {/* Sidebar — desktop: fixed on the right, mobile: hidden drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-64 max-w-[85vw] flex-col border-l border-white/60 bg-white/80 shadow-xl backdrop-blur-lg transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Overlay for mobile drawer */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-navy/50 backdrop-blur-sm lg:hidden"
          aria-label="إغلاق القائمة"
        />
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col lg:mr-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/60 bg-white/80 px-4 shadow-sm backdrop-blur-lg lg:hidden">
          <h1 className="text-base font-extrabold text-navy">🌟 منصة مس دنيا</h1>
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl bg-primary/10 p-2.5 text-primary transition-colors hover:bg-primary/20"
            aria-label="فتح القائمة"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
