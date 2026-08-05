import { useNavigate, useParams, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import BackButton from "../components/BackButton";
import GradeCard from "../components/GradeCard";
import { getStageConfig } from "../data/stages";

export default function GradeSelectPage() {
  const { stage } = useParams();
  const navigate = useNavigate();

  const config = getStageConfig(stage);

  if (!config) {
    return <Navigate to="/levels" replace />;
  }

  const handleSelectGrade = (grade) => {
    navigate(`/exam/${config.key}`, { state: { grade: grade.label } });
  };

  return (
    <MainLayout>
      <div className="w-full max-w-lg">
        <div className="animate-fade-up mb-4 flex justify-start">
          <BackButton to="/levels" label="رجوع" />
        </div>

        <div
          className="animate-fade-up text-center"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="text-3xl" aria-hidden="true">
            {config.icon}
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-navy sm:text-3xl">
            اختار صفك في {config.stageTitle}
          </h1>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:mt-10">
          {config.grades.map((grade, index) => (
            <GradeCard
              key={grade.key}
              label={grade.label}
              accent={config.accent}
              delay={`${0.15 + index * 0.1}s`}
              onClick={() => handleSelectGrade(grade)}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
