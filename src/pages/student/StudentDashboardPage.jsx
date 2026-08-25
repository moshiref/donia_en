import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useStudentAuth } from "../../contexts/StudentAuthContext";
import { fetchStudentAttempts } from "../../lib/studentService";
import { getStudentAccess, getStudentExamsPath } from "../../lib/studentAccess";
import { STAGES } from "../../data/stages";

function CopyCodeButton({ code }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* ignore */
        }
      }}
      className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
    >
      {copied ? "✅ تم النسخ" : "📋 نسخ الكود"}
    </button>
  );
}

export default function StudentDashboardPage() {
  const { student, loading: authLoading, signOutStudent } = useStudentAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !student) return;
    async function load() {
      try {
        const data = await fetchStudentAttempts(student);
        setAttempts(data || []);
      } catch (err) {
        console.error(err);
        setError("حدث خطأ أثناء تحميل نتائجك");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authLoading, student]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-purple/5">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!student) {
    return <Navigate to="/login" replace />;
  }

  const handleSignOut = () => {
    signOutStudent();
    navigate("/");
  };

  const bestPercentage = attempts.reduce(
    (max, a) => Math.max(max, Number(a.percentage) || 0),
    0
  );

  // نطاق الطالب المسموح — محدد من المدرسة فقط
  const access = getStudentAccess(student);
  const examsPath = getStudentExamsPath(student);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-purple/5 px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        {examsPath && (
          <button
            onClick={() => navigate(examsPath)}
            className="mb-4 text-sm font-bold text-primary hover:underline"
          >
            → اختباراتي
          </button>
        )}

        {/* Student Card */}
        <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg backdrop-blur-lg sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-navy/50">أهلاً بك</p>
              <h1 className="mt-1 text-2xl font-extrabold text-navy">
                👋 {student.full_name}
              </h1>
              <p className="mt-1 text-sm font-bold text-navy/60">
                {STAGES[student.stage]?.stageTitle || student.stage} —{" "}
                {student.grade}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-xl bg-error/10 px-4 py-2 text-sm font-bold text-error transition-colors hover:bg-error/20"
            >
              خروج 🚪
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-navy/5 p-4">
            <div>
              <p className="text-xs text-navy/50">كود الطالب الخاص بك</p>
              <p
                dir="ltr"
                className="text-3xl font-extrabold tracking-[0.3em] text-primary"
              >
                {student.student_code}
              </p>
            </div>
            <CopyCodeButton code={student.student_code} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-navy/5 p-3 text-center">
              <p className="text-xs text-navy/50">📝 عدد الاختبارات</p>
              <p className="mt-1 text-xl font-extrabold text-navy">
                {attempts.length}
              </p>
            </div>
            <div className="rounded-xl bg-navy/5 p-3 text-center">
              <p className="text-xs text-navy/50">🏆 أفضل نتيجة</p>
              <p className="mt-1 text-xl font-extrabold text-success">
                {bestPercentage}%
              </p>
            </div>
          </div>

          {examsPath ? (
            <button
              onClick={() => navigate(examsPath)}
              className="mt-5 block w-full rounded-xl bg-primary px-6 py-3.5 text-center text-sm font-bold text-white shadow-md transition-colors hover:bg-primary/90"
            >
              🚀 ابدأ اختبارًا جديدًا ({access.grade.label})
            </button>
          ) : (
            <div className="mt-5 rounded-xl bg-error/10 px-4 py-3 text-center text-xs font-bold text-error">
              🔒 لا يمكنك دخول الاختبارات حتى تحدد المدرسة مرحلتك وصفك.
            </div>
          )}
        </div>

        {/* Previous Results */}
        <h2 className="mt-8 text-lg font-extrabold text-navy">📊 نتائجي السابقة</h2>
        {loading ? (
          <div className="mt-4 text-center text-sm font-bold text-navy/40">
            جاري التحميل...
          </div>
        ) : error ? (
          <div className="mt-4 rounded-xl bg-error/10 p-4 text-center text-sm font-bold text-error">
            {error}
          </div>
        ) : attempts.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-white/70 p-8 text-center text-sm font-bold text-navy/40 backdrop-blur-lg">
            لم تخض أي اختبار بعد — ابدأ أول اختبار لك! 💪
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3 pb-8">
            {attempts.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-lg"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-navy">
                    {a.exams?.title || "اختبار"}
                  </p>
                  <p className="mt-0.5 text-xs text-navy/50">
                    {a.submitted_at
                      ? new Date(a.submitted_at).toLocaleDateString("ar-EG")
                      : "-"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-extrabold text-navy">
                    {a.score}/{a.total_score}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-extrabold ${
                      a.percentage >= 90
                        ? "bg-success/15 text-success"
                        : a.percentage >= 50
                          ? "bg-primary/10 text-primary"
                          : "bg-error/10 text-error"
                    }`}
                  >
                    {a.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
