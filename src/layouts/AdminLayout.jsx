import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const NAV_ITEMS = [
  { to: "/admin", icon: "🏠", label: "الرئيسية", end: true },
  { to: "/admin/exams", icon: "📝", label: "الاختبارات" },
  { to: "/admin/exams/new", icon: "➕", label: "إنشاء اختبار" },
  { to: "/admin/results", icon: "👨‍🎓", label: "نتائج الطلاب" },
  { to: "/admin/top-students", icon: "🏆", label: "الطلاب المتفوقون" },
  { to: "/admin/settings", icon: "⚙️", label: "إعدادات المنصة" },
];

export default function AdminLayout() {
  const { signOut, session } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-dvh bg-sky/40">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 right-0 z-30 flex w-64 flex-col border-l border-white/60 bg-white/80 shadow-xl backdrop-blur-lg">
        <div className="flex h-16 items-center justify-center border-b border-navy/10 px-4">
          <h1 className="text-lg font-extrabold text-navy">
            🌟 منصة مس دنيا
          </h1>
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

        <div className="border-t border-navy/10 p-4">
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
      </aside>

      {/* Main content */}
      <main className="mr-64 flex-1 p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
