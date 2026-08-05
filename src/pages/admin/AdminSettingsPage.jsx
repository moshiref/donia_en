import { useAuth } from "../../contexts/AuthContext";

export default function AdminSettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-navy">⚙️ إعدادات المنصة</h1>
      <p className="mt-1 text-sm text-navy/60">إعدادات الحساب والمنصة</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account Info */}
        <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-lg">
          <h2 className="text-lg font-extrabold text-navy">👤 معلومات الحساب</h2>
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <p className="text-xs text-navy/50">البريد الإلكتروني</p>
              <p className="font-bold text-navy" dir="ltr">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-navy/50">الدور</p>
              <p className="font-bold text-navy">مديرة المنصة</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="mt-6 w-full rounded-xl border-2 border-error/30 bg-error/5 px-4 py-2.5 text-sm font-bold text-error transition-colors hover:bg-error/10"
          >
            🚪 تسجيل الخروج
          </button>
        </div>

        {/* Platform Info */}
        <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-lg">
          <h2 className="text-lg font-extrabold text-navy">📊 معلومات المنصة</h2>
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <p className="text-xs text-navy/50">اسم المنصة</p>
              <p className="font-bold text-navy">منصة مس دنيا للاختبارات والتفوق</p>
            </div>
            <div>
              <p className="text-xs text-navy/50">المراحل المتاحة</p>
              <p className="font-bold text-navy">📚 المرحلة الابتدائية | 🎒 المرحلة الإعدادية</p>
            </div>
            <div>
              <p className="text-xs text-navy/50">حالة قاعدة البيانات</p>
              <p className="font-bold text-success">🟢 متصلة</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
