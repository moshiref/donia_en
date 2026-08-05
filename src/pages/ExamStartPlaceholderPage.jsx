import { useLocation, useParams, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import BackButton from "../components/BackButton";
import { getStageConfig } from "../data/stages";

export default function ExamStartPlaceholderPage() {
  const { stage } = useParams();
  const location = useLocation();

  const config = getStageConfig(stage);
  const studentName = location.state?.studentName?.trim();

  if (!config) {
    return <Navigate to="/levels" replace />;
  }

  return (
    <MainLayout>
      <div className="w-full max-w-lg">
        <div className="animate-fade-up mb-4 flex justify-start">
          <BackButton to="/levels" label="رجوع لاختيار المرحلة" />
        </div>

        <div
          className="animate-pop-in w-full rounded-[2rem] border border-white/60 bg-white/70 px-6 py-10 text-center shadow-xl shadow-primary/10 backdrop-blur-lg sm:px-10 sm:py-12"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="text-4xl" aria-hidden="true">
            {config.icon}
          </span>

          {studentName ? (
            <h1 className="mt-4 text-xl font-extrabold text-navy sm:text-2xl">
              أهلاً يا {studentName}! 👋
            </h1>
          ) : (
            <h1 className="mt-4 text-xl font-extrabold text-navy sm:text-2xl">
              أهلاً يا بطل! 👋
            </h1>
          )}

          <p className="mt-5 text-lg font-bold text-primary sm:text-xl">
            الاختبار هيكون هنا قريبًا ❤️
          </p>

          <p className="mt-3 text-base leading-relaxed text-navy/70 sm:text-lg">
            الأستاذة دنيا بتجهز {config.title} دلوقتي، تابعونا!
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
