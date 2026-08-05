import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/admin");
    } catch (err) {
      setError("بيانات الدخول غير صحيحة. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-sky via-white to-sky px-4">
      <div className="w-full max-w-md rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-xl shadow-primary/10 backdrop-blur-lg sm:p-10">
        <div className="text-center">
          <span className="text-4xl">🌟</span>
          <h1 className="mt-3 text-2xl font-extrabold text-navy">
            لوحة تحكم الأستاذة دنيا
          </h1>
          <p className="mt-2 text-sm text-navy/60">
            سجّلي الدخول للوصول إلى لوحة التحكم
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          {error && (
            <div className="rounded-xl bg-error/10 px-4 py-3 text-center text-sm font-bold text-error">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-navy">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              className="w-full rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-3 text-navy transition-colors focus:border-primary"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-navy">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
              className="w-full rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-3 text-navy transition-colors focus:border-primary"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-2xl bg-gradient-to-l from-primary to-purple px-6 py-3.5 text-lg font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول 🔐"}
          </button>
        </form>
      </div>
    </div>
  );
}
