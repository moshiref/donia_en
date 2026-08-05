import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDashboardStats, fetchExams, fetchAttempts } from "../../lib/examService";

const STATUS_MAP = {
  draft: { label: "مسودة", color: "bg-yellow/20 text-yellow-700", dot: "🟡" },
  published: { label: "منشور", color: "bg-success/20 text-success-700", dot: "🟢" },
  stopped: { label: "متوقف", color: "bg-error/20 text-error-700", dot: "🔴" },
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentExams, setRecentExams] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [statsData, examsData, attemptsData] = await Promise.all([
          fetchDashboardStats(),
          fetchExams(),
          fetchAttempts(),
        ]);
        setStats(statsData);
        setRecentExams(examsData.slice(0, 5));
        setRecentResults(attemptsData.slice(0, 5));
      } catch (err) {
        setError("حدث خطأ أثناء تحميل البيانات");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-navy/60">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-error/10 p-6 text-center text-error font-bold">
        {error}
      </div>
    );
  }

  const statCards = [
    { label: "إجمالي الاختبارات", value: stats.totalExams, icon: "📝", color: "from-primary to-primary/70" },
    { label: "الاختبارات المنشورة", value: stats.publishedExams, icon: "🟢", color: "from-success to-success/70" },
    { label: "محاولات الطلاب", value: stats.totalAttempts, icon: "👨‍🎓", color: "from-purple to-purple/70" },
    { label: "الطلاب المتفوقون (90%+)", value: stats.topStudents, icon: "🏆", color: "from-yellow to-yellow/70" },
    { label: "متوسط الدرجات", value: `${stats.averagePercentage}%`, icon: "📊", color: "from-navy to-navy/70" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-navy">🏠 الرئيسية</h1>
      <p className="mt-1 text-sm text-navy/60">نظرة عامة على أداء المنصة</p>

      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-md shadow-primary/5 backdrop-blur-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              <span className={`bg-gradient-to-l ${card.color} bg-clip-text text-3xl font-extrabold text-transparent`}>
                {card.value}
              </span>
            </div>
            <p className="mt-2 text-sm font-bold text-navy/70">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Exams */}
        <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md shadow-primary/5 backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-navy">📝 آخر الاختبارات</h2>
            <Link to="/admin/exams" className="text-sm font-bold text-primary hover:underline">
              عرض الكل ←
            </Link>
          </div>
          {recentExams.length === 0 ? (
            <p className="mt-4 text-center text-sm text-navy/50">لا توجد اختبارات بعد</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {recentExams.map((exam) => (
                <li key={exam.id} className="flex items-center justify-between rounded-xl bg-navy/5 px-4 py-3">
                  <div>
                    <p className="font-bold text-navy">{exam.title}</p>
                    <p className="text-xs text-navy/50">{exam.grade}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_MAP[exam.status]?.color}`}>
                    {STATUS_MAP[exam.status]?.dot} {STATUS_MAP[exam.status]?.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Results */}
        <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md shadow-primary/5 backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-navy">👨‍🎓 أحدث النتائج</h2>
            <Link to="/admin/results" className="text-sm font-bold text-primary hover:underline">
              عرض الكل ←
            </Link>
          </div>
          {recentResults.length === 0 ? (
            <p className="mt-4 text-center text-sm text-navy/50">لا توجد نتائج بعد</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {recentResults.map((attempt) => (
                <li key={attempt.id} className="flex items-center justify-between rounded-xl bg-navy/5 px-4 py-3">
                  <div>
                    <p className="font-bold text-navy">{attempt.student_name}</p>
                    <p className="text-xs text-navy/50">{attempt.exams?.title}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-navy">{attempt.score}/{attempt.total_score}</p>
                    <p className={`text-xs font-bold ${attempt.percentage >= 90 ? "text-success" : attempt.percentage >= 50 ? "text-primary" : "text-error"}`}>
                      {attempt.percentage}%
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
