import MainLayout from "../layouts/MainLayout";
import BackButton from "../components/BackButton";
import StageCard from "../components/StageCard";

export default function LevelsPage() {
  return (
    <MainLayout>
      <div className="w-full max-w-4xl">
        <div className="animate-fade-up mb-4 flex justify-start">
          <BackButton to="/" label="رجوع" />
        </div>

        <div
          className="animate-fade-up text-center"
          style={{ animationDelay: "0.1s" }}
        >
          <h1 className="text-2xl font-extrabold text-navy sm:text-3xl md:text-4xl">
            🎯 اختار مرحلتك الدراسية
          </h1>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-12 sm:grid-cols-2 sm:gap-8">
          <StageCard
            icon="📚"
            title="المرحلة الابتدائية"
            description="من الصف الثالث الابتدائي إلى الصف السادس الابتدائي"
            gradesPath="/levels/primary"
            accent="primary"
            delay="0.25s"
          />
          <StageCard
            icon="🎒"
            title="المرحلة الإعدادية"
            description="من الصف الأول الإعدادي إلى الصف الثالث الإعدادي"
            gradesPath="/levels/preparatory"
            accent="purple"
            delay="0.4s"
          />
        </div>
      </div>
    </MainLayout>
  );
}
