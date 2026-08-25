import { useEffect, useState } from "react";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import {
  fetchPublishedExams,
  fetchStudentAttemptMap,
  getExamQuestionCount,
} from "../../lib/examService";
import { STAGES } from "../../data/stages";
import { useStudentAuth } from "../../contexts/StudentAuthContext";
import { getStudentAccess, getStudentExamsPath } from "../../lib/studentAccess";

export default function StudentExamsPage() {
  const { stageId, gradeId } = useParams();
  const navigate = useNavigate();
  const { student, isStudentLoggedIn } = useStudentAuth();
  const [exams, setExams] = useState([]);
  const [attemptMap, setAttemptMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const stage = STAGES[stageId];
  const grade = stage?.grades.find((g) => g.key === gradeId);

  // صلاحية الطالب المسجل: مرحلة وصف محددان من الإدارة فقط
  const access = isStudentLoggedIn ? getStudentAccess(student) : null;
  const studentExamsPath = isStudentLoggedIn ? getStudentExamsPath(student) : null;

  useEffect(() => {
    async function load() {
      if (!stage || !grade) {
        setError("الصف غير موجود");
        setLoading(false);
        return;
      }
      try {
        let data = await fetchPublishedExams(stageId, grade.label);
        // طبقة حماية إضافية: الطالب المسجل لا يرى إلا امتحانات نطاقه
        if (isStudentLoggedIn && access?.allowed) {
          data = data.filter(
            (e) => e.stage === student.stage && e.grade === student.grade
          );
        }
        setExams(data);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل الاختبارات");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [stageId, gradeId, isStudentLoggedIn, access?.allowed, student?.stage, student?.grade, stage, grade]);

  // حالة محاولات الطالب على هذه الامتحانات (تم الأداء / جاري)
  useEffect(() => {
    if (!isStudentLoggedIn || !student?.id) return;
    fetchStudentAttemptMap(student.id)
      .then(setAttemptMap)
      .catch((err) => console.error(err));
  }, [isStudentLoggedIn, student?.id]);

  // طالب مسجل بلا مرحلة/صف محددين → ممنوع
  if (isStudentLoggedIn && !access.allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-purple/5 px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/70 p-10 text-center shadow-lg backdrop-blur-lg">
          <span className="text-5xl">🔒</span>
          <h2 className="mt-4 text-xl font-extrabold text-navy">غير مصرح</h2>
          <p className="mt-2 text-sm text-navy/60">
            راجعي مدرستك لتحديد المرحلة والصف الخاصين بك.
          </p>
        </div>
      </div>
    );
  }

  // محاولة وصول يدوي عبر URL لمرحلة/صف غير المسموح بها → تحويل إجباري لنطاقه
  if (
    isStudentLoggedIn &&
    access.allowed &&
    studentExamsPath &&
    (stageId !== access.stageKey || gradeId !== access.grade.key)
  ) {
    return <Navigate to={studentExamsPath} replace />;
  }

  // طالب مسجل يفتح صف غير موجود في النظام → نفس التحويل
  if (isStudentLoggedIn && access.allowed && (!stage || !grade)) {
    return <Navigate to={studentExamsPath} replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-purple/5">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-navy/60">جاري تحميل الاختبارات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-purple/5 px-4">
        <div className="rounded-2xl bg-error/10 p-6 text-center text-error font-bold">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-purple/5 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate(isStudentLoggedIn ? "/dashboard" : "/")}
          className="mb-4 text-sm font-bold text-primary hover:underline"
        >
          {isStudentLoggedIn ? "→ حسابي" : "→ العودة للرئيسية"}
        </button>

        <div className="text-center">
          <span className="text-4xl">{stage.icon}</span>
          <h1 className="mt-2 text-2xl font-extrabold text-navy">
            اختبارات {grade.label}
          </h1>
          <p className="mt-1 text-sm text-navy/60">{stage.stageTitle}</p>
        </div>

        {exams.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/60 bg-white/70 p-12 text-center shadow-md backdrop-blur-lg">
            <span className="text-5xl">📝</span>
            <p className="mt-4 text-lg font-bold text-navy/60">لا توجد اختبارات متاحة حاليًا</p>
            <p className="mt-2 text-sm text-navy/40">تحقق مرة أخرى لاحقًا</p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {exams.map((exam) => {
              const attemptStatus = attemptMap.get(exam.id);
              const isAttempted =
                attemptStatus === "submitted" ||
                attemptStatus === "auto_submitted";
              const isInProgress = attemptStatus === "in_progress";

              return (
              <div
                key={exam.id}
                className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-lg transition-all hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-extrabold text-navy">📝 {exam.title}</h3>
                  {isAttempted && (
                    <span className="shrink-0 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">
                      ✅ تم الأداء
                    </span>
                  )}
                  {isInProgress && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      ⏳ جاري
                    </span>
                  )}
                </div>
                {exam.description && (
                  <p className="mt-1 text-sm text-navy/60">{exam.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-bold text-navy">
                    ❓ {getExamQuestionCount(exam)} سؤال
                  </span>
                  <span className="rounded-full bg-yellow/10 px-3 py-1 text-xs font-bold text-yellow-700">
                    🎯 {exam.total_score} درجة
                  </span>
                  <span className="rounded-full bg-error/10 px-3 py-1 text-xs font-bold text-error">
                    ⏱️ {exam.duration_minutes} دقيقة
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/exam/${exam.id}/start`)}
                  disabled={isAttempted}
                  className={`mt-4 w-full rounded-xl px-6 py-3 text-sm font-bold shadow-md transition-all ${
                    isAttempted
                      ? "cursor-not-allowed bg-navy/10 text-navy/40"
                      : "bg-primary text-white hover:bg-primary/90 hover:shadow-lg"
                  }`}
                >
                  {isAttempted
                    ? "لقد قمت بأداء هذا الاختبار من قبل."
                    : isInProgress
                      ? "⏳ استكمال الاختبار"
                      : "🚀 ابدأ الاختبار"}
                </button>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
