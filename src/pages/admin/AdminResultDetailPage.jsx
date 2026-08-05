import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { fetchAnswers } from "../../lib/examService";
import { STAGES } from "../../data/stages";

export default function AdminResultDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        // Fetch attempt with exam info
        const { data: attemptData, error: attemptError } = await supabase
          .from("attempts")
          .select("*, exams(title, stage, grade)")
          .eq("id", id)
          .single();
        if (attemptError) throw attemptError;
        setAttempt(attemptData);

        // Fetch answers
        const answersData = await fetchAnswers(id);
        setAnswers(answersData);

        // Fetch questions with choices
        const { data: questionsData, error: qError } = await supabase
          .from("questions")
          .select("*, choices(*)")
          .eq("exam_id", attemptData.exam_id)
          .order("sort_order");
        if (qError) throw qError;
        setQuestions(questionsData);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل تفاصيل النتيجة");
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
          <p className="mt-4 text-sm font-bold text-navy/60">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="rounded-2xl bg-error/10 p-6 text-center text-error font-bold">
        {error || "النتيجة غير موجودة"}
      </div>
    );
  }

  const correctCount = answers.filter((a) => a.is_correct).length;
  const wrongCount = answers.filter((a) => !a.is_correct).length;
  const unanswered = questions.length - answers.length;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <button
        onClick={() => navigate("/admin/results")}
        className="mb-4 text-sm font-bold text-primary hover:underline"
      >
        → العودة للنتائج
      </button>

      <h1 className="text-2xl font-extrabold text-navy">📋 تفاصيل النتيجة</h1>

      {/* Student Info Card */}
      <div className="mt-6 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-lg">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-navy/50">اسم الطالب</p>
            <p className="text-lg font-extrabold text-navy">{attempt.student_name}</p>
          </div>
          <div>
            <p className="text-xs text-navy/50">المرحلة</p>
            <p className="font-bold text-navy">{STAGES[attempt.stage]?.stageTitle || attempt.stage}</p>
          </div>
          <div>
            <p className="text-xs text-navy/50">الصف</p>
            <p className="font-bold text-navy">{attempt.grade}</p>
          </div>
          <div>
            <p className="text-xs text-navy/50">الاختبار</p>
            <p className="font-bold text-navy">{attempt.exams?.title}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-navy/10 pt-4 md:grid-cols-5">
          <div className="text-center">
            <p className="text-2xl font-extrabold text-navy">{attempt.score}/{attempt.total_score}</p>
            <p className="text-xs text-navy/50">الدرجة</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-extrabold ${attempt.percentage >= 90 ? "text-success" : attempt.percentage >= 50 ? "text-primary" : "text-error"}`}>
              {attempt.percentage}%
            </p>
            <p className="text-xs text-navy/50">النسبة المئوية</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-success">{correctCount}</p>
            <p className="text-xs text-navy/50">إجابات صحيحة</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-error">{wrongCount}</p>
            <p className="text-xs text-navy/50">إجابات خاطئة</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-navy/40">{unanswered}</p>
            <p className="text-xs text-navy/50">بدون إجابة</p>
          </div>
        </div>

        <div className="mt-4 border-t border-navy/10 pt-4 text-sm text-navy/50">
          <p>تاريخ التسليم: {formatDate(attempt.submitted_at)}</p>
          <p>طريقة التسليم: {attempt.status === "auto_submitted" ? "⏱️ تلقائي (انتهاء الوقت)" : "📤 يدوي"}</p>
        </div>
      </div>

      {/* Questions & Answers */}
      <h2 className="mt-8 text-lg font-extrabold text-navy">📝 تفاصيل الإجابات</h2>
      <div className="mt-4 flex flex-col gap-4">
        {questions.map((q, qIndex) => {
          const answer = answers.find((a) => a.question_id === q.id);
          const selectedIds = answer?.selected_choice_ids || [];
          const correctChoices = q.choices?.filter((c) => c.is_correct) || [];

          return (
            <div
              key={q.id}
              className={`rounded-2xl border p-5 shadow-sm backdrop-blur-lg ${
                answer?.is_correct
                  ? "border-success/30 bg-success/5"
                  : answer
                    ? "border-error/30 bg-error/5"
                    : "border-navy/10 bg-white/70"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-bold text-navy">
                    س{qIndex + 1}: {q.question_text}
                  </p>
                  {q.image_url && (
                    <img src={q.image_url} alt="سؤال" className="mt-2 max-h-40 rounded-xl" />
                  )}
                </div>
                <span className="mr-4 rounded-full bg-navy/10 px-3 py-1 text-xs font-bold text-navy">
                  {q.score} درجة
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-1.5">
                {q.choices
                  ?.sort((a, b) => a.sort_order - b.sort_order)
                  .map((c) => {
                    const isSelected = selectedIds.includes(c.id);
                    const isCorrect = c.is_correct;
                    let bgClass = "bg-white/80";
                    if (isSelected && isCorrect) bgClass = "bg-success/20 border-success/40";
                    else if (isSelected && !isCorrect) bgClass = "bg-error/20 border-error/40";
                    else if (isCorrect) bgClass = "bg-success/10 border-success/20";

                    return (
                      <div
                        key={c.id}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${bgClass}`}
                      >
                        <span>{isSelected ? (isCorrect ? "✅" : "❌") : isCorrect ? "✅" : "⬜"}</span>
                        <span className={isSelected ? "font-bold" : ""}>{c.choice_text}</span>
                        {isSelected && <span className="text-xs text-navy/50">(اختيار الطالب)</span>}
                        {isCorrect && !isSelected && <span className="text-xs text-success">(الإجابة الصحيحة)</span>}
                      </div>
                    );
                  })}
              </div>

              <div className="mt-2 text-xs text-navy/50">
                {answer
                  ? `الدرجة المكتسبة: ${answer.score_earned}/${q.score}`
                  : "لم يتم الإجابة على هذا السؤال"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
