import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { fetchAnswers } from "../../lib/examService";
import {
  computeAttemptStats,
  evaluateAnswer,
  resolveScoreEarned,
} from "../../lib/answerUtils";
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

  // Compute statistics from the student's actual answer data.
  // Supports all legacy formats: selected_choice_ids rows, old
  // is_correct/score_earned-only rows, and attempts with no answer
  // rows at all (stats derived from the stored score, never modified).
  const stats = computeAttemptStats(
    questions,
    answers,
    attempt ? Number(attempt.score) : null
  );
  const { correctAnswers, wrongAnswers, unanswered } = {
    correctAnswers: stats.correct,
    wrongAnswers: stats.wrong,
    unanswered: stats.unanswered,
  };

  // Map of question_id -> answer row for per-question details
  const answerMap = new Map();
  answers.forEach((a) => answerMap.set(a.question_id, a));

  const getQuestionResult = (question) => {
    const evaluation = evaluateAnswer(answerMap.get(question.id), question);
    return {
      ...evaluation,
      scoreEarned: resolveScoreEarned(
        answerMap.get(question.id),
        question,
        evaluation
      ),
    };
  };

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
            <p className="text-2xl font-extrabold text-success">{correctAnswers}</p>
            <p className="text-xs text-navy/50">إجابات صحيحة</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-error">{wrongAnswers}</p>
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

        {stats.inferred && (
          <div className="mt-3 rounded-xl bg-navy/5 px-4 py-3 text-xs font-bold text-navy/50">
            ℹ️ هذه نتيجة قديمة لم تُحفظ لها إجابات تفصيلية، لذلك تم اشتقاق
            الإحصائيات من الدرجة النهائية المحفوظة ({attempt.score}/{attempt.total_score})
            دون أي تعديل عليها.
          </div>
        )}
      </div>

      {/* Questions & Answers */}
      <h2 className="mt-8 text-lg font-extrabold text-navy">📝 تفاصيل الإجابات</h2>
      <div className="mt-4 flex flex-col gap-4">
        {questions.map((q, qIndex) => {
          const { answered, correct, selectedIds, scoreEarned } =
            getQuestionResult(q);

          return (
            <div
              key={q.id}
              className={`rounded-2xl border p-5 shadow-sm backdrop-blur-lg ${
                !answered
                  ? "border-navy/10 bg-white/70"
                  : correct
                    ? "border-success/30 bg-success/5"
                    : "border-error/30 bg-error/5"
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
                <div className="mr-4 flex flex-col items-end gap-2">
                  <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-bold text-navy">
                    {q.score} درجة
                  </span>
                  {!answered ? (
                    <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-bold text-navy/50">
                      بدون إجابة
                    </span>
                  ) : correct ? (
                    <span className="rounded-full bg-success/20 px-3 py-1 text-xs font-bold text-success">
                      ✅ صحيحة
                    </span>
                  ) : (
                    <span className="rounded-full bg-error/20 px-3 py-1 text-xs font-bold text-error">
                      ❌ خاطئة
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-1.5">
                {q.choices
                  ?.sort((a, b) => a.sort_order - b.sort_order)
                  .map((c) => {
                    const isSelected = selectedIds.includes(c.id);
                    const isCorrectChoice = c.is_correct;
                    let bgClass = "bg-white/80 border-navy/10";
                    if (isSelected && isCorrectChoice) bgClass = "bg-success/20 border-success/40";
                    else if (isSelected && !isCorrectChoice) bgClass = "bg-error/20 border-error/40";
                    else if (isCorrectChoice) bgClass = "bg-success/10 border-success/20";

                    return (
                      <div
                        key={c.id}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${bgClass}`}
                      >
                        <span>{isSelected ? (isCorrectChoice ? "✅" : "❌") : isCorrectChoice ? "🟢" : "⬜"}</span>
                        <span className={isSelected ? "font-bold" : ""}>{c.choice_text}</span>
                        {isSelected && (
                          <span className="text-xs text-navy/50">(إجابة الطالب)</span>
                        )}
                        {isCorrectChoice && !isSelected && (
                          <span className="text-xs font-bold text-success">(الإجابة الصحيحة)</span>
                        )}
                      </div>
                    );
                  })}
              </div>

              <div className="mt-2 text-xs font-bold text-navy/60">
                {!answered ? (
                  <span>لم يتم الإجابة على هذا السؤال</span>
                ) : (
                  <span>
                    إجابة الطالب:{" "}
                    {selectedIds.length > 0
                      ? q.choices
                          ?.filter((c) => selectedIds.includes(c.id))
                          .map((c) => c.choice_text)
                          .join("، ")
                      : "غير معروفة (بيانات قديمة)"}
                    {" — "}الدرجة المكتسبة: {scoreEarned}/{q.score}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
