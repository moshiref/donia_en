import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { STAGES } from "../../data/stages";
import { useStudentAuth } from "../../contexts/StudentAuthContext";
import { getStudentAccess, getStudentExamsPath } from "../../lib/studentAccess";

export default function StudentHomePage() {
  const [selectedStage, setSelectedStage] = useState(null);
  const navigate = useNavigate();
  const { student, isStudentLoggedIn, signOutStudent } = useStudentAuth();

  // صلاحية الطالب من بياناته المحفوظة — لا اختيار حر للمسجل دخوله
  const access = getStudentAccess(isStudentLoggedIn ? student : null);
  const examsPath = isStudentLoggedIn ? getStudentExamsPath(student) : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-white to-purple/5 px-4 py-8">
      <div className="w-full max-w-2xl text-center">
        {/* Logo / Title */}
        <div className="mb-8">
          <span className="text-6xl">🎓</span>
          <h1 className="mt-4 text-3xl font-extrabold text-navy md:text-4xl">
            منصة مس دنيا
          </h1>
          <p className="mt-2 text-lg text-navy/60">للاختبارات والتفوق</p>

          {/* Student Account Area */}
          <div className="mt-5 flex items-center justify-center gap-3">
            {isStudentLoggedIn ? (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-primary/90"
                >
                  👤 حسابي — {student.full_name}
                </button>
                <button
                  onClick={signOutStudent}
                  className="rounded-xl bg-navy/10 px-4 py-2.5 text-sm font-bold text-navy/60 transition-colors hover:bg-navy/20"
                >
                  خروج
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="rounded-xl bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
              >
                🔐 دخول الطالب بالكود
              </button>
            )}
          </div>
        </div>

        {isStudentLoggedIn && !access.allowed ? (
          /* طالب بدون مرحلة/صف محددين من الإدارة — يمنع اختيار أي شيء */
          <div className="rounded-3xl border border-white/60 bg-white/70 p-10 shadow-lg backdrop-blur-lg">
            <span className="text-5xl">🔒</span>
            <h2 className="mt-4 text-xl font-extrabold text-navy">
              مرحبتك الدراسية غير محددة بعد
            </h2>
            <p className="mt-2 text-sm text-navy/60">
              راجعي مدرستك لتحديد المرحلة والصف الخاصين بك، ثم سجّلي الدخول مرة أخرى.
            </p>
          </div>
        ) : isStudentLoggedIn && access.allowed ? (
          /* الطالب يرى مرحلته وصفه المحددين من المدرسة فقط */
          <div>
            <h2 className="mb-6 text-xl font-bold text-navy">
              {access.stageConfig.icon} مرحبتك الدراسية
            </h2>
            <div className="rounded-3xl border-2 border-white/60 bg-white/70 p-8 shadow-lg backdrop-blur-lg">
              <span className="text-5xl">{access.stageConfig.icon}</span>
              <h3 className="mt-3 text-xl font-extrabold text-navy">
                {access.stageConfig.stageTitle}
              </h3>
              <button
                onClick={() => navigate(examsPath)}
                className="mt-5 w-full rounded-2xl border-2 border-primary/30 bg-white/80 p-5 shadow-md transition-all hover:border-primary hover:scale-[1.02]"
              >
                <span className="text-2xl">📗</span>
                <p className="mt-1 text-lg font-extrabold text-navy">
                  {access.grade.label}
                </p>
                <p className="mt-1 text-xs text-navy/50">اضغطي لعرض اختبارات صفك</p>
              </button>
            </div>
          </div>
        ) : (
          /* الزائر غير المسجل — نفس السلوك السابق */
          <>
        {!selectedStage ? (
          /* Stage Selection */
          <div>
            <h2 className="mb-6 text-xl font-bold text-navy">اختر مرحلتك الدراسية</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.values(STAGES).map((stage) => (
                <button
                  key={stage.key}
                  onClick={() => setSelectedStage(stage.key)}
                  className="group rounded-3xl border-2 border-white/60 bg-white/70 p-8 shadow-lg backdrop-blur-lg transition-all hover:border-primary/40 hover:shadow-xl hover:scale-[1.02]"
                >
                  <span className="text-5xl">{stage.icon}</span>
                  <h3 className="mt-4 text-xl font-extrabold text-navy group-hover:text-primary">
                    {stage.stageTitle}
                  </h3>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Grade Selection */
          <div>
            <button
              onClick={() => setSelectedStage(null)}
              className="mb-4 text-sm font-bold text-primary hover:underline"
            >
              → العودة لاختيار المرحلة
            </button>
            <h2 className="mb-6 text-xl font-bold text-navy">
              {STAGES[selectedStage].icon} {STAGES[selectedStage].stageTitle} — اختر صفك
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {STAGES[selectedStage].grades.map((grade) => (
                <button
                  key={grade.key}
                  onClick={() => navigate(`/exams/${selectedStage}/${grade.key}`)}
                  className="group rounded-2xl border-2 border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-lg transition-all hover:border-primary/40 hover:shadow-lg hover:scale-[1.02]"
                >
                  <span className="text-3xl"></span>
                  <h3 className="mt-2 text-lg font-extrabold text-navy group-hover:text-primary">
                    {grade.label}
                  </h3>
                </button>
              ))}
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
