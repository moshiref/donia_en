import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStudentAuth } from "../../contexts/StudentAuthContext";

export default function StudentLoginPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginByCode } = useStudentAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = code.replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      setError("من فضلك اكتب الكود المكوّن من 6 أرقام");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await loginByCode(cleanCode);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      if (err.message === "الكود غير صحيح أو غير موجود.") {
        setError(err.message);
      } else if (err.message === "هذا الحساب غير مفعل، يرجى التواصل مع المدرسة.") {
        setError(err.message);
      } else {
        setError("حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-purple/5 px-4 py-8">
      <div className="w-full max-w-md">
        {location.pathname !== "/" && (
          <button
            onClick={() => navigate("/")}
            className="mb-4 text-sm font-bold text-primary hover:underline"
          >
            → العودة للرئيسية
          </button>
        )}

        <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-lg backdrop-blur-lg">
          <div className="text-center">
            <span className="text-5xl">🎓</span>
            <h1 className="mt-3 text-2xl font-extrabold text-navy">
              دخول الطالب
            </h1>
            <p className="mt-2 text-sm text-navy/60">
              اكتب الكود الذي أعطتك إياه المدرسة لتدخل حسابك
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            {error && (
              <div className="rounded-xl bg-error/10 px-4 py-3 text-center text-sm font-bold text-error">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="student-code"
                className="mb-1.5 block text-sm font-bold text-navy"
              >
                Student Code — كود الطالب
              </label>
              <input
                id="student-code"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                dir="ltr"
                placeholder="583214"
                className="w-full rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-4 text-center text-2xl font-extrabold tracking-[0.35em] text-navy transition-colors focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-2xl bg-gradient-to-l from-primary to-purple px-6 py-3.5 text-lg font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? "جاري الدخول..." : "تسجيل الدخول 🚀"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-navy/40">
            ليس لديك كود؟ اطلبه من مدرستك — لا يمكن إنشاء حساب بنفسك.
          </p>
        </div>
      </div>
    </div>
  );
}
