import { useEffect, useState } from "react";
import { fetchTopStudents } from "../../lib/examService";
import { STAGES } from "../../data/stages";

export default function AdminTopStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchTopStudents();
        setStudents(data);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل البيانات");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-navy/60">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-navy">🏆 الطلاب المتفوقون</h1>
      <p className="mt-1 text-sm text-navy/60">الطلاب الذين حصلوا على 90% أو أكثر</p>

      {error && (
        <div className="mt-4 rounded-xl bg-error/10 px-4 py-3 text-sm font-bold text-error">
          {error}
        </div>
      )}

      {students.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-white/60 bg-white/70 p-12 text-center shadow-md backdrop-blur-lg">
          <span className="text-5xl">🏆</span>
          <p className="mt-4 text-lg font-bold text-navy/60">لا يوجد طلاب متفوقون بعد</p>
          <p className="mt-2 text-sm text-navy/40">سيظهر هنا الطلاب الذين يحصلون على 90% أو أكثر</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/60 bg-white/70 shadow-md backdrop-blur-lg">
          <table className="w-full min-w-[700px] text-right">
            <thead>
              <tr className="border-b border-navy/10 bg-navy/5">
                <th className="px-4 py-3 text-sm font-bold text-navy">#</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">اسم الطالب</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">الصف</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">الاختبار</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">الدرجة</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">النسبة</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id} className="border-b border-navy/5 transition-colors hover:bg-navy/5">
                  <td className="px-4 py-3 text-sm font-bold text-navy/50">
                    {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                  </td>
                  <td className="px-4 py-3 font-bold text-navy">{s.student_name}</td>
                  <td className="px-4 py-3 text-sm text-navy/70">{s.grade}</td>
                  <td className="px-4 py-3 text-sm text-navy/70">{s.exams?.title}</td>
                  <td className="px-4 py-3 text-sm font-bold text-navy">{s.score}/{s.total_score}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-success/20 px-3 py-1 text-xs font-bold text-success">
                      {s.percentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-navy/50">{formatDate(s.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
