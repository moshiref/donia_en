import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchExamById, fetchQuestions, startStudentAttempt } from "../../lib/examService";
import { useStudentAuth } from "../../contexts/StudentAuthContext";
import {
  canStudentOpenExam,
  getStudentAccess,
  getStudentExamsPath,
} from "../../lib/studentAccess";

export default function StudentExamStartPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { student, isStudentLoggedIn } = useStudentAuth();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [studentName, setStudentName] = useState(
    isStudentLoggedIn && student ? student.full_name : ""
  );
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  // صلاحية فتح هذا الامتحان تحديدًا
  const examAllowed = isStudentLoggedIn && canStudentOpenExam(student, exam);

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
    if (!isStudentLoggedIn) {
      setError("سجّلي الدخول بكود الطالب أولًا");
      return;
    }
    // تحقق نهائي من الصلاحية قبل البدء (لا يعتمد على الواجهة فقط)
    if (!canStudentOpenExam(student, exam)) {
      setError("غير مصرح لك بهذا الاختبار — خارج مرحلتك أو صفك الدراسي");
      return;
    }
    if (!studentName.trim()) {
      setError("من فضلك اكتب اسمك أولاً");
      return;
    }
    setStarting(true);
    setError("");
    try {
      // بدء/استئناف عبر الخادم: يفرض قاعدة Student+Exam=Attempt واحدة
      // والصلاحية (stage/grade) من بيانات الطالب المخزنة في DB
      const attempt = await startStudentAttempt(examId, student);
      // Save attempt info to localStorage for recovery
      localStorage.setItem(`exam_${examId}_attempt`, JSON.stringify({
        attemptId: attempt.id,
        studentName: attempt.student_name || studentName.trim(),
        startedAt: attempt.started_at,
      }));
      navigate(`/exam/${examId}/take/${attempt.id}`);
    } catch (err) {
      if (err?.code === "ALREADY_ATTEMPTED") {
        setError("لقد قمت بأداء هذا الاختبار من قبل.");
      } else if (err?.code === "NOT_ALLOWED") {
        setError("غير مصرح لك بهذا الاختبار — خارج مرحلتك أو صفك الدراسي");
      } else if (err?.code === "STUDENT_INACTIVE") {
        setError(err.message);
      } else if (err?.code === "EXAM_UNAVAILABLE") {
        setError("هذا الاختبار غير متاح حاليًا.");
      } else {
        setError("حدث خطأ أثناء بدء الاختبار. حاول مرة أخرى.");
      }
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

  const access = isStudentLoggedIn ? getStudentAccess(student) : null;
  const examsPath = getStudentExamsPath(student);

  // طالب بدون تسجيل دخول — لا بدء امتحان
  if (!isStudentLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-purple/5 px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/70 p-10 text-center shadow-lg backdrop-blur-lg">
          <span className="text-5xl">🔐</span>
          <h2 className="mt-4 text-xl font-extrabold text-navy">تسجيل الدخول مطلوب</h2>
          <p className="mt-2 text-sm text-navy/60">
            سجّلي الدخول بكود الطالب الخاص بك لبدء الاختبار.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 w-full rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            🔐 دخول الطالب بالكود
          </button>
          <button
            onClick={() => navigate("/")}
            className="mt-3 w-full rounded-xl bg-navy/10 px-6 py-3 text-sm font-bold text-navy/60 transition-colors hover:bg-navy/20"
          >
            → العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  // طالب مسجل لكن الامتحان خارج مرحلته/صفه المسموح بهما — منع نهائي
  if (exam && !examAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-white to-purple/5 px-4">
        <div className="w-full max-w-md rounded-3xl border border-error/30 bg-error/5 p-10 text-center shadow-lg">
          <span className="text-5xl">🚫</span>
          <h2 className="mt-4 text-xl font-extrabold text-error">غير مصرح</h2>
          <p className="mt-2 text-sm text-navy/60">
            هذا الاختبار خاص بمرحلة أو صف آخر. صلاحيتك:{" "}
            {access.allowed
              ? `${access.stageConfig.stageTitle} — ${access.grade.label}`
              : "غير محددة، راجعي مدرستك"}
          </p>
          {examsPath ? (
            <button
              onClick={() => navigate(examsPath)}
              className="mt-6 w-full rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
            >
              → اختباراتي المسموح بها
            </button>
          ) : null}
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-3 w-full rounded-xl bg-navy/10 px-6 py-3 text-sm font-bold text-navy/60 transition-colors hover:bg-navy/20"
          >
            حسابي
          </button>
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
              disabled={isStudentLoggedIn}
              className="w-full rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-3 text-navy placeholder-navy/40 focus:border-primary disabled:bg-navy/5"
              maxLength={100}
            />
            {isStudentLoggedIn && (
              <p className="mt-1.5 text-xs font-bold text-success">
                ✅ مسجّل دخول كـ {student.full_name} — كود {student.student_code}
              </p>
            )}
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
