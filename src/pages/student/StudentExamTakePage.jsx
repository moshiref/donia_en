import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchExamById,
  fetchQuestions,
  fetchAttempt,
  saveAnswer,
  submitAttempt,
} from "../../lib/examService";

export default function StudentExamTakePage() {
  const { examId, attemptId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { questionId: [choiceIds] }
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState(""); // "saving" | "saved" | ""

  const timerRef = useRef(null);
  const submittedRef = useRef(false);
  const answersRef = useRef({});
  answersRef.current = answers;

  // Load exam, questions, and existing attempt
  useEffect(() => {
    async function load() {
      try {
        const [examData, questionsData, attemptData] = await Promise.all([
          fetchExamById(examId),
          fetchQuestions(examId),
          fetchAttempt(attemptId),
        ]);

        if (attemptData.status !== "in_progress") {
          // Already submitted - go to result
          navigate(`/exam/${examId}/result/${attemptId}`, { replace: true });
          return;
        }

        setExam(examData);
        setQuestions(questionsData);

        // Restore saved answers from localStorage
        const savedAnswers = localStorage.getItem(`exam_${examId}_answers_${attemptId}`);
        if (savedAnswers) {
          try {
            setAnswers(JSON.parse(savedAnswers));
          } catch { /* ignore */ }
        }

        // Calculate time left
        const startedAt = new Date(attemptData.started_at).getTime();
        const durationMs = examData.duration_minutes * 60 * 1000;
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));
        setTimeLeft(remaining);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل الاختبار");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [examId, attemptId, navigate]);

  // Timer
  useEffect(() => {
    if (loading || submitted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, submitted]);

  // Save answer to localStorage and DB
  const handleAnswer = useCallback(
    async (questionId, choiceIds) => {
      const newAnswers = { ...answersRef.current, [questionId]: choiceIds };
      setAnswers(newAnswers);

      // Save to localStorage immediately
      localStorage.setItem(
        `exam_${examId}_answers_${attemptId}`,
        JSON.stringify(newAnswers)
      );

      // Save to DB
      setSaveStatus("saving");
      try {
        await saveAnswer(attemptId, questionId, choiceIds);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch (err) {
        console.error("Failed to save answer:", err);
        setSaveStatus("");
      }
    },
    [examId, attemptId]
  );

  // Submit handler
  const doSubmit = useCallback(
    async (isAuto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      clearInterval(timerRef.current);

      try {
        await submitAttempt(attemptId, answersRef.current, isAuto);
        // Clear localStorage
        localStorage.removeItem(`exam_${examId}_answers_${attemptId}`);
        localStorage.removeItem(`exam_${examId}_attempt`);
        setSubmitted(true);
        navigate(`/exam/${examId}/result/${attemptId}`, { replace: true });
      } catch (err) {
        console.error("Submit error:", err);
        // If already submitted, redirect to result
        if (err.message?.includes("already submitted")) {
          navigate(`/exam/${examId}/result/${attemptId}`, { replace: true });
          return;
        }
        setError("حدث خطأ أثناء التسليم. حاول مرة أخرى.");
        submittedRef.current = false;
        setSubmitting(false);
      }
    },
    [attemptId, examId, navigate]
  );

  const handleAutoSubmit = useCallback(() => {
    doSubmit(true);
  }, [doSubmit]);

  const handleManualSubmit = () => {
    setShowConfirm(false);
    doSubmit(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;
  const isTimeWarning = timeLeft <= 60 && timeLeft > 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-purple/5">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-navy/60">جاري تحميل الاختبار...</p>
        </div>
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-purple/5 px-4">
        <div className="rounded-2xl bg-error/10 p-6 text-center text-error font-bold">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-purple/5">
      {/* Sticky Header with Timer */}
      <div className="sticky top-0 z-50 border-b border-navy/10 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-sm font-extrabold text-navy">{exam.title}</h1>
            <p className="text-xs text-navy/50">
              {answeredCount}/{questions.length} سؤال
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === "saving" && (
              <span className="text-xs text-navy/40">💾 جاري الحفظ...</span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs text-success">✅ تم الحفظ</span>
            )}
            <div
              className={`rounded-xl px-4 py-2 text-lg font-extrabold ${
                isTimeWarning
                  ? "animate-pulse bg-error/20 text-error"
                  : "bg-navy/10 text-navy"
              }`}
            >
              ⏱️ {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-xl bg-error/10 px-4 py-3 text-sm font-bold text-error">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-6">
          {questions.map((q, qIndex) => {
            const selectedIds = answers[q.id] || [];
            const isMultiple = q.question_type === "multi_select";

            return (
              <div
                key={q.id}
                className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-lg"
              >
                <div className="flex items-start justify-between">
                  <p className="text-lg font-bold text-navy">
                    س{qIndex + 1}: {q.question_text}
                  </p>
                  <span className="mr-4 shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {q.score} درجة
                  </span>
                </div>

                {q.image_url && (
                  <img src={q.image_url} alt="سؤال" className="mt-3 max-h-48 rounded-xl" />
                )}

                <div className="mt-4 flex flex-col gap-2">
                  {q.choices
                    ?.sort((a, b) => a.sort_order - b.sort_order)
                    .map((c) => {
                      const isSelected = selectedIds.includes(c.id);

                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            if (submitted || submitting) return;
                            let newIds;
                            if (isMultiple) {
                              newIds = isSelected
                                ? selectedIds.filter((id) => id !== c.id)
                                : [...selectedIds, c.id];
                            } else {
                              newIds = [c.id];
                            }
                            handleAnswer(q.id, newIds);
                          }}
                          disabled={submitted || submitting}
                          className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-right text-sm transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 font-bold text-primary"
                              : "border-navy/10 bg-white/80 text-navy/70 hover:border-primary/30"
                          } disabled:opacity-50`}
                        >
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                            isSelected ? "border-primary bg-primary text-white" : "border-navy/20"
                          }`}>
                            {isSelected && "✓"}
                          </span>
                          <span>{c.choice_text}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <div className="mt-8 pb-8">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting || submitted}
            className="w-full rounded-xl bg-success px-6 py-4 text-lg font-bold text-white shadow-md transition-all hover:bg-success/90 hover:shadow-lg disabled:opacity-50"
          >
            {submitting ? "جاري التسليم..." : "📤 تسليم الاختبار"}
          </button>
          <p className="mt-3 text-center text-xs text-navy/40">
            تمت الإجابة على {answeredCount} من {questions.length} سؤال
          </p>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="text-center">
              <span className="text-5xl">⚠️</span>
              <h2 className="mt-4 text-xl font-extrabold text-navy">
                هل أنت متأكد أنك تريد تسليم الاختبار؟
              </h2>
              <p className="mt-2 text-sm text-navy/60">
                بعد التسليم لن تتمكن من تعديل إجاباتك.
              </p>
              <p className="mt-1 text-sm text-navy/60">
                تمت الإجابة على {answeredCount} من {questions.length} سؤال
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border-2 border-navy/20 px-4 py-3 text-sm font-bold text-navy transition-colors hover:bg-navy/5"
              >
                إلغاء
              </button>
              <button
                onClick={handleManualSubmit}
                className="flex-1 rounded-xl bg-success px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-success/90"
              >
                📤 تسليم الاختبار
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
