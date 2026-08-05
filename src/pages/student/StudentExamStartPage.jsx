import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchExamById, fetchQuestions, createAttempt } from "../../lib/examService";
import { STAGES } from "../../data/stages";

export default function StudentExamStartPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [examData, questionsData] = await Promise.all([
          fetchExamById(examId),
          fetchQuestions(examId),
        ]);
        if (examData.status !== "published") {
          setError("هذا الاختبار غير متاح حاليًا");
          setLoading(false);
          return;
        }
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
  }, [examId]);

  const handleStart = async () => {
    if (!studentName.trim()) {
      setError("من فضلك اكتب اسمك أولاً");
      return;
    }
    setStarting(true);
    setError("");
    try {
      const attempt = await createAttempt(examId, studentName.trim(), exam.stage, exam.grade);
      // Save attempt info to localStorage for recovery
      localStorage.setItem(`exam_${examId}_attempt`, JSON.stringify({
        attemptId: attempt.id,
        studentName: studentName.trim(),
        startedAt: attempt.started_at,
      }));
      navigate(`/exam/${examId}/take/${attempt.id}`);
    } catch (err) {
      setError("حدث خطأ أثناء بدء الاختبار. حاول مرة أخرى.");
      console.error(err);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-purple/5">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-navy/60">جاري التحميل...</p>
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-purple/5 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-lg backdrop-blur-lg">
          <div className="text-center">
            <span className="text-5xl">📝</span>
            <h1 className="mt-4 text-2xl font-extrabold text-navy">{exam.title}</h1>
            {exam.description && (
              <p className="mt-2 text-sm text-navy/60">{exam.description}</p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-navy/5 p-3 text-center">
              <p className="text-xs text-navy/50">📚 الصف</p>
              <p className="font-bold text-navy">{exam.grade}</p>
            </div>
            <div className="rounded-xl bg-navy/5 p-3 text-center">
              <p className="text-xs text-navy/50">❓ عدد الأسئلة</p>
              <p className="font-bold text-navy">{questions.length}</p>
            </div>
            <div className="rounded-xl bg-navy/5 p-3 text-center">
              <p className="text-xs text-navy/50">🎯 الدرجة النهائية</p>
              <p className="font-bold text-navy">{exam.total_score} درجة</p>
            </div>
            <div className="rounded-xl bg-navy/5 p-3 text-center">
              <p className="text-xs text-navy/50">⏱️ مدة الاختبار</p>
              <p className="font-bold text-navy">{exam.duration_minutes} دقيقة</p>
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-bold text-navy">
              👋 أهلاً بك! اكتب اسمك هنا
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="اسم الطالب..."
              className="w-full rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-3 text-navy placeholder-navy/40 focus:border-primary"
              maxLength={100}
            />
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-error/10 px-4 py-3 text-sm font-bold text-error">
              {error}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={starting || !studentName.trim()}
            className="mt-6 w-full rounded-xl bg-primary px-6 py-4 text-lg font-bold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:opacity-50"
          >
            {starting ? "جاري البدء..." : "🚀 ابدأ الاختبار"}
          </button>

          <p className="mt-4 text-center text-xs text-navy/40">
            ⚠️ بمجرد بدء الاختبار سيبدأ العد التنازلي تلقائيًا
          </p>
        </div>
      </div>
    </div>
  );
}
