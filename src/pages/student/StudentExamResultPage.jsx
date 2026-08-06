import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAttempt, fetchAnswers } from "../../lib/examService";
import { supabase } from "../../lib/supabase";

export default function StudentExamResultPage() {
  const { examId, attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const attemptData = await fetchAttempt(attemptId);
        setAttempt(attemptData);

        const { data: examData, error: examError } = await supabase
          .from("exams")
          .select("*")
          .eq("id", examId)
          .single();
        if (examError) throw examError;
        setExam(examData);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل النتيجة");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [examId, attemptId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-purple/5">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-navy/60">جاري تحميل النتيجة...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-purple/5 px-4">
        <div className="rounded-2xl bg-error/10 p-6 text-center text-error font-bold">
          {error || "النتيجة غير موجودة"}
        </div>
      </div>
    );
  }

  const percentage = attempt.percentage;
  const isExcellent = percentage >= 90;
  const isGood = percentage >= 70 && percentage < 90;
  const isPass = percentage >= 50 && percentage < 70;
  const isFail = percentage < 50;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-purple/5 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-lg backdrop-blur-lg text-center">
          {/* Result Icon */}
          <span className="text-6xl">
            {isExcellent ? "🏆" : isGood ? "🌟" : isPass ? "👍" : "💪"}
          </span>

          {/* Student Name */}
          <h1 className="mt-4 text-2xl font-extrabold text-navy">
            {attempt.student_name}
          </h1>
          <p className="mt-1 text-sm text-navy/60">{exam?.title}</p>

          {/* Score */}
          <div className="mt-6 rounded-2xl bg-navy/5 p-6">
            <p className="text-4xl font-extrabold text-navy">
              {attempt.score} / {attempt.total_score}
            </p>
            <p className={`mt-2 text-3xl font-extrabold ${
              isExcellent ? "text-success" : isGood ? "text-primary" : isPass ? "text-yellow-600" : "text-error"
            }`}>
              {percentage}%
            </p>
          </div>

          {/* Message */}
          <div className="mt-6">
            {isExcellent && (
              <div className="rounded-2xl bg-success/10 p-4">
                <p className="text-lg font-extrabold text-success">🏆🌟 برافو يا بطل!</p>
                <p className="mt-1 text-sm text-success/80">
                  أنت من الطلاب المتفوقين! مبروك على نتيجتك الرائعة ❤️
                </p>
              </div>
            )}
            {isGood && (
              <div className="rounded-2xl bg-primary/10 p-4">
                <p className="text-lg font-extrabold text-primary">🌟 أحسنت!</p>
                <p className="mt-1 text-sm text-primary/80">
                  نتيجة جيدة جدًا! استمر في التفوق 💪
                </p>
              </div>
            )}
            {isPass && (
              <div className="rounded-2xl bg-yellow/10 p-4">
                <p className="text-lg font-extrabold text-yellow-700">👍 ناجح</p>
                <p className="mt-1 text-sm text-yellow-600">
                  نجحت! يمكنك تحسين نتيجتك أكثر في المرة القادمة 📚
                </p>
              </div>
            )}
            {isFail && (
              <div className="rounded-2xl bg-error/10 p-4">
                <p className="text-lg font-extrabold text-error">راجع وذاكر درجتك مش كويسه</p>
                <p className="mt-1 text-sm text-error/80">
                  راجع الدروس وحاول مرة أخرى. ! 📖
                </p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-navy/5 p-3">
              <p className="text-xs text-navy/50"> الصف</p>
              <p className="font-bold text-navy">{attempt.grade}</p>
            </div>
            <div className="rounded-xl bg-navy/5 p-3">
              <p className="text-xs text-navy/50">📅 التاريخ</p>
              <p className="font-bold text-navy">
                {new Date(attempt.submitted_at).toLocaleDateString("ar-EG")}
              </p>
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="mt-6 w-full rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-primary/90"
          >
            🏠 العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
