import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { STAGES } from "../../data/stages";

export default function StudentHomePage() {
  const [selectedStage, setSelectedStage] = useState(null);
  const navigate = useNavigate();

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
        </div>

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
      </div>
    </div>
  );
}
