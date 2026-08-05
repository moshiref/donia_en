import { useState } from "react";
import { useNavigate, useParams, useLocation, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import BackButton from "../components/BackButton";
import PrimaryButton from "../components/PrimaryButton";
import { getStageConfig } from "../data/stages";

export default function ExamEntryPage() {
  const { stage } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const config = getStageConfig(stage);
  const grade = location.state?.grade;

  if (!config) {
    return <Navigate to="/levels" replace />;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate(`/exam/${config.key}/start`, {
      state: { studentName: name.trim(), grade },
    });
  };

  return (
    <MainLayout>
      <div className="w-full max-w-lg">
        <div className="animate-fade-up mb-4 flex justify-start">
          <BackButton to="/levels" label="رجوع لاختيار المرحلة" />
        </div>

        <div
          className="animate-pop-in w-full rounded-[2rem] border border-white/60 bg-white/70 px-6 py-9 text-center shadow-xl shadow-primary/10 backdrop-blur-lg sm:px-10 sm:py-11"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="text-3xl" aria-hidden="true">
            {config.icon}
          </span>

          <h1 className="mt-3 text-xl font-extrabold text-navy sm:text-2xl">
            📝 {config.title}
          </h1>

          {grade && (
            <p className="mt-1 text-sm font-bold text-navy/50 sm:text-base">
              {grade}
            </p>
          )}

          <p className="mt-5 text-lg font-bold text-primary sm:text-xl">
            جاهز يا بطل تبدأ الاختبار؟ 🚀
          </p>

          <p className="mt-3 text-base leading-relaxed text-navy/70 sm:text-lg">
            اكتب اسمك وخلينا نشوف شطارتك! 🌟
          </p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col items-stretch gap-5">
            <label htmlFor="student-name" className="sr-only">
              اكتب اسمك هنا
            </label>
            <input
              id="student-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="اكتب اسمك هنا"
              required
              className="w-full rounded-2xl border-2 border-primary/20 bg-white/90 px-5 py-3.5 text-center text-lg font-bold text-navy placeholder:font-normal placeholder:text-navy/40 transition-colors duration-200 focus:border-primary sm:text-xl"
            />

            <PrimaryButton type="submit" className="w-full">
              ابدأ الاختبار 🚀
            </PrimaryButton>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
