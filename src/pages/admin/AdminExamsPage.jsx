import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchExams, deleteExam, updateExam } from "../../lib/examService";
import { STAGES } from "../../data/stages";

const STATUS_MAP = {
  draft: { label: "مسودة", color: "bg-yellow/20 text-yellow-700", dot: "🟡" },
  published: { label: "منشور", color: "bg-success/20 text-success-700", dot: "🟢" },
  stopped: { label: "متوقف", color: "bg-error/20 text-error-700", dot: "🔴" },
};

export default function AdminExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const loadExams = async () => {
    try {
      const data = await fetchExams();
      setExams(data);
    } catch (err) {
      setError("حدث خطأ أثناء تحميل الاختبارات");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteExam(deleteConfirm.id);
      setExams((prev) => prev.filter((e) => e.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      setError("حدث خطأ أثناء حذف الاختبار");
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (exam, newStatus) => {
    try {
      await updateExam(exam.id, { status: newStatus });
      setExams((prev) =>
        prev.map((e) => (e.id === exam.id ? { ...e, status: newStatus } : e))
      );
    } catch (err) {
      setError("حدث خطأ أثناء تغيير حالة الاختبار");
    }
  };

  const getStageLabel = (stage) => STAGES[stage]?.stageTitle || stage;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-navy/60">جاري تحميل الاختبارات...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">📝 الاختبارات</h1>
          <p className="mt-1 text-sm text-navy/60">إدارة جميع اختبارات المنصة</p>
        </div>
        <Link
          to="/admin/exams/new"
          className="rounded-2xl bg-gradient-to-l from-primary to-purple px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 sm:px-6 sm:py-3"
        >
          ➕ إنشاء اختبار جديد
        </Link>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-error/10 px-4 py-3 text-sm font-bold text-error">
          {error}
        </div>
      )}

      {exams.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-white/60 bg-white/70 p-12 text-center shadow-md backdrop-blur-lg">
          <span className="text-5xl">📝</span>
          <p className="mt-4 text-lg font-bold text-navy/60">لا توجد اختبارات بعد</p>
          <p className="mt-2 text-sm text-navy/40">ابدئي بإنشاء أول اختبار للطلاب</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/60 bg-white/70 shadow-md backdrop-blur-lg">
          <table className="w-full min-w-[800px] text-right">
            <thead>
              <tr className="border-b border-navy/10 bg-navy/5">
                <th className="px-4 py-3 text-sm font-bold text-navy">اسم الاختبار</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">المرحلة</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">الصف</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">الأسئلة</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">الدرجة</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">المدة</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">الحالة</th>
                <th className="px-4 py-3 text-sm font-bold text-navy">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id} className="border-b border-navy/5 transition-colors hover:bg-navy/5">
                  <td className="px-4 py-3 font-bold text-navy">{exam.title}</td>
                  <td className="px-4 py-3 text-sm text-navy/70">{getStageLabel(exam.stage)}</td>
                  <td className="px-4 py-3 text-sm text-navy/70">{exam.grade}</td>
                  <td className="px-4 py-3 text-sm text-navy/70">{exam.questions?.[0]?.count ?? 0}</td>
                  <td className="px-4 py-3 text-sm font-bold text-navy">{exam.total_score}</td>
                  <td className="px-4 py-3 text-sm text-navy/70">{exam.duration_minutes} دقيقة</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${STATUS_MAP[exam.status]?.color}`}>
                      {STATUS_MAP[exam.status]?.dot} {STATUS_MAP[exam.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/admin/exams/${exam.id}/edit`)}
                        title="تعديل"
                        className="rounded-lg p-2 text-sm transition-colors hover:bg-primary/10"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => navigate(`/admin/exams/${exam.id}/preview`)}
                        title="معاينة"
                        className="rounded-lg p-2 text-sm transition-colors hover:bg-primary/10"
                      >
                        👁️
                      </button>
                      {exam.status !== "published" && (
                        <button
                          onClick={() => handleStatusChange(exam, "published")}
                          title="نشر"
                          className="rounded-lg p-2 text-sm transition-colors hover:bg-success/10"
                        >
                          🟢
                        </button>
                      )}
                      {exam.status === "published" && (
                        <button
                          onClick={() => handleStatusChange(exam, "stopped")}
                          title="إيقاف"
                          className="rounded-lg p-2 text-sm transition-colors hover:bg-error/10"
                        >
                          🔴
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(exam)}
                        title="حذف"
                        className="rounded-lg p-2 text-sm transition-colors hover:bg-error/10"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-navy">⚠️ تأكيد الحذف</h3>
            <p className="mt-3 text-sm text-navy/70">
              هل أنتِ متأكدة أنك تريدين حذف اختبار "{deleteConfirm.title}"؟
              <br />
              <span className="font-bold text-error">سيتم حذف جميع الأسئلة والنتائج المرتبطة به نهائيًا.</span>
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border-2 border-navy/20 px-4 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-navy/5"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-error px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-error/90 disabled:opacity-50"
              >
                {deleting ? "جاري الحذف..." : "🗑️ حذف نهائي"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
