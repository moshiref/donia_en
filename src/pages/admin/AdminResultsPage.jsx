import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAttempts, fetchExams } from "../../lib/examService";
import { STAGES } from "../../data/stages";

export default function AdminResultsPage() {
  const [attempts, setAttempts] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterExam, setFilterExam] = useState("");
  const [filterResult, setFilterResult] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [attemptsData, examsData] = await Promise.all([
          fetchAttempts(),
          fetchExams(),
        ]);
        setAttempts(attemptsData);
        setExams(examsData);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل النتائج");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const grades = filterStage ? STAGES[filterStage]?.grades || [] : [];

  const filtered = attempts.filter((a) => {
    if (search && !a.student_name.includes(search)) return false;
    if (filterStage && a.stage !== filterStage) return false;
    if (filterGrade && a.grade !== filterGrade) return false;
    if (filterExam && a.exam_id !== filterExam) return false;
    if (filterResult === "excellent" && a.percentage < 90) return false;
    if (filterResult === "pass" && (a.percentage < 50 || a.percentage >= 90)) return false;
    if (filterResult === "fail" && a.percentage >= 50) return false;
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-navy/60">جاري تحميل النتائج...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-navy">👨‍🎓 نتائج الطلاب</h1>
      <p className="mt-1 text-sm text-navy/60">جميع نتائج الاختبارات المسجلة</p>

      {error && (
        <div className="mt-4 rounded-xl bg-error/10 px-4 py-3 text-sm font-bold text-error">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-md backdrop-blur-lg">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 بحث باسم الطالب..."
            className="rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-2.5 text-sm text-navy focus:border-primary"
          />
          <select
            value={filterStage}
            onChange={(e) => { setFilterStage(e.target.value); setFilterGrade(""); }}
            className="rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-2.5 text-sm text-navy focus:border-primary"
          >
            <option value="">كل المراحل</option>
            {Object.values(STAGES).map((s) => (
              <option key={s.key} value={s.key}>{s.icon} {s.stageTitle}</option>
            ))}
          </select>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-2.5 text-sm text-navy focus:border-primary"
          >
            <option value="">كل الصفوف</option>
            {grades.map((g) => (
              <option key={g.key} value={g.label}>{g.label}</option>
            ))}
          </select>
          <select
            value={filterExam}
            onChange={(e) => setFilterExam(e.target.value)}
            className="rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-2.5 text-sm text-navy focus:border-primary"
          >
            <option value="">كل الاختبارات</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            className="rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-2.5 text-sm text-navy focus:border-primary"
          >
            <option value="">كل النتائج</option>
            <option value="excellent">🏆 متفوق (90%+)</option>
            <option value="pass">✅ ناجح (50-89%)</option>
            {/* <option value="fail">❌ راسب (<50%)</option> */}
            <option value="fail">❌ راسب (&lt;50%)</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/60 bg-white/70 p-12 text-center shadow-md backdrop-blur-lg">
          <span className="text-5xl">📊</span>
          <p className="mt-4 text-lg font-bold text-navy/60">لا توجد نتائج مطابقة</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/60 bg-white/70 shadow-md backdrop-blur-lg">
          <table className="w-full min-w-[900px] text-right">
            <thead>
              <tr className="border-b border-navy/10 bg-navy/5">
                <th className="px-4 py-3 text-sm font-bold text-navy">اسم الطالب</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">المرحلة</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">الصف</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">الاختبار</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">الدرجة</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">النسبة</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => navigate(`/admin/results/${a.id}`)}
                  className="cursor-pointer border-b border-navy/5 transition-colors hover:bg-primary/5"
                >
                  <td className="px-4 py-3 font-bold text-navy">{a.student_name}</td>
                  <td className="px-4 py-3 text-sm text-navy/70">
                    {STAGES[a.stage]?.stageTitle || a.stage}
                  </td>
                  <td className="px-4 py-3 text-sm text-navy/70">{a.grade}</td>
                  <td className="px-4 py-3 text-sm text-navy/70">{a.exams?.title}</td>
                  <td className="px-4 py-3 text-sm font-bold text-navy">
                    {a.score}/{a.total_score}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        a.percentage >= 90
                          ? "bg-success/20 text-success"
                          : a.percentage >= 50
                            ? "bg-primary/20 text-primary"
                            : "bg-error/20 text-error"
                      }`}
                    >
                      {a.percentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-navy/50">
                    {formatDate(a.submitted_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
