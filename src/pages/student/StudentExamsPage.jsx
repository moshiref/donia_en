import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPublishedExams } from "../../lib/examService";
import { STAGES } from "../../data/stages";

export default function StudentExamsPage() {
  const { stageId, gradeId } = useParams();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const stage = STAGES[stageId];
  const grade = stage?.grades.find((g) => g.key === gradeId);

  useEffect(() => {
    async function load() {
      if (!stage || !grade) {
        setError("الصف غير موجود");
        setLoading(false);
        return;
      }
      try {
        const data = await fetchPublishedExams(stageId, grade.label);
        setExams(data);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل الاختبارات");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [stageId, gradeId]);

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
          onClick={() => navigate("/")}
          className="mb-4 text-sm font-bold text-primary hover:underline"
        >
          → العودة للرئيسية
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
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-lg transition-all hover:shadow-lg"
              >
                <h3 className="text-lg font-extrabold text-navy">📝 {exam.title}</h3>
                {exam.description && (
                  <p className="mt-1 text-sm text-navy/60">{exam.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-bold text-navy">
                    ❓ {exam.questions_count || 0} سؤال
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
                  className="mt-4 w-full rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
                >
                  🚀 ابدأ الاختبار
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
