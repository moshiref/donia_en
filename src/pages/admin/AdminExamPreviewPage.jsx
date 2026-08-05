import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchExamById, fetchQuestions } from "../../lib/examService";
import { STAGES } from "../../data/stages";

export default function AdminExamPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [examData, questionsData] = await Promise.all([
          fetchExamById(id),
          fetchQuestions(id),
        ]);
        setExam(examData);
        setQuestions(questionsData);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل الاختبار");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-navy/60">جاري تحميل المعاينة...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="rounded-2xl bg-error/10 p-6 text-center text-error font-bold">
        {error || "الاختبار غير موجود"}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate("/admin/exams")}
        className="mb-4 text-sm font-bold text-primary hover:underline"
      >
        → العودة للاختبارات
      </button>

      <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-lg">
        <div className="text-center">
          <span className="text-4xl">👁️</span>
          <h1 className="mt-2 text-2xl font-extrabold text-navy">{exam.title}</h1>
          {exam.description && (
            <p className="mt-2 text-sm text-navy/60">{exam.description}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary">
              {STAGES[exam.stage]?.icon} {STAGES[exam.stage]?.stageTitle}
            </span>
            <span className="rounded-full bg-purple/10 px-4 py-1.5 text-sm font-bold text-purple">
              📚 {exam.grade}
            </span>
            <span className="rounded-full bg-navy/10 px-4 py-1.5 text-sm font-bold text-navy">
              ❓ {questions.length} سؤال
            </span>
            <span className="rounded-full bg-yellow/10 px-4 py-1.5 text-sm font-bold text-yellow-700">
              🎯 {exam.total_score} درجة
            </span>
            <span className="rounded-full bg-error/10 px-4 py-1.5 text-sm font-bold text-error">
              ⏱️ {exam.duration_minutes} دقيقة
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-lg font-bold text-navy">
                  س{i + 1}: {q.question_text}
                </p>
                {q.image_url && (
                  <img src={q.image_url} alt="سؤال" className="mt-3 max-h-48 rounded-xl" />
                )}
              </div>
              <span className="mr-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {q.score} درجة
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {q.choices
                ?.sort((a, b) => a.sort_order - b.sort_order)
                .map((c) => (
                  <div
                    key={c.id}
                    className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm ${
                      c.is_correct
                        ? "border-success/40 bg-success/10 font-bold text-success"
                        : "border-navy/10 bg-white/80 text-navy/70"
                    }`}
                  >
                    <span>{c.is_correct ? "✅" : "⬜"}</span>
                    <span>{c.choice_text}</span>
                    {c.is_correct && <span className="text-xs">(الإجابة الصحيحة)</span>}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
