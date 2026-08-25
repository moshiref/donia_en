import { useEffect, useState } from "react";
import {
  createStudent,
  fetchStudents,
  deleteStudent,
} from "../../lib/studentService";
import { STAGES } from "../../data/stages";

function CopyCodeButton({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // fallback for browsers without clipboard permission
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
        copied
          ? "bg-success/20 text-success"
          : "bg-primary/10 text-primary hover:bg-primary/20"
      }`}
    >
      {copied ? "✅ تم النسخ" : "📋 نسخ الكود"}
    </button>
  );
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Add form
  const [fullName, setFullName] = useState("");
  const [stage, setStage] = useState("");
  const [grade, setGrade] = useState("");

  // Newly created student (show code modal)
  const [createdStudent, setCreatedStudent] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await fetchStudents();
      setStudents(data || []);
    } catch (err) {
      console.error(err);
      setError(
        err?.code === "PGRST205"
          ? "جدول الطلاب غير موجود في قاعدة البيانات بعد. نفّذي ملف supabase/add_students_system.sql في Supabase Dashboard → SQL Editor ثم أعيدي تحميل الصفحة."
          : "حدث خطأ أثناء تحميل الطلاب."
      );
    } finally {
      setLoading(false);
    }
  }

  const grades = stage ? STAGES[stage]?.grades || [] : [];

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !stage || !grade) {
      setError("أكملي بيانات الطالب: الاسم والمرحلة والصف");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const student = await createStudent({ fullName, stage, grade });
      setStudents((prev) => [student, ...prev]);
      setCreatedStudent(student);
      setFullName("");
      setStage("");
      setGrade("");
    } catch (err) {
      console.error(err);
      setError(
        err?.code === "PGRST205"
          ? "جدول الطلاب غير موجود بعد — نفّذي supabase/add_students_system.sql في Supabase SQL Editor أولًا."
          : "حدث خطأ أثناء إضافة الطالب. حاولي مرة أخرى."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (student) => {
    if (
      !window.confirm(
        `حذف الطالب "${student.full_name}"؟ لن يتم حذف نتائجه المحفوظة، لكنه لن يستطيع الدخول بكوده بعد الحذف.`
      )
    )
      return;
    try {
      await deleteStudent(student.id);
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    } catch (err) {
      console.error(err);
      setError("تعذر حذف الطالب.");
    }
  };

  const filtered = students.filter(
    (s) =>
      !search.trim() ||
      s.full_name.includes(search.trim()) ||
      s.student_code.includes(search.trim())
  );

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
      <h1 className="text-2xl font-extrabold text-navy">🎓 إدارة الطلاب</h1>
      <p className="mt-1 text-sm text-navy/50">
        الإضافة فقط من هنا — كل طالب يحصل على كود دخول من 6 أرقام يستخدمه لتسجيل الدخول.
      </p>

      {/* Add Student Form */}
      <form
        onSubmit={handleAdd}
        className="mt-6 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-lg"
      >
        <h2 className="font-extrabold text-navy">➕ إضافة طالب جديد</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="اسم الطالب *"
            maxLength={100}
            className="w-full rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-3 text-sm text-navy placeholder:text-navy/40 focus:border-primary md:col-span-2"
          />
          <select
            value={stage}
            onChange={(e) => {
              setStage(e.target.value);
              setGrade("");
            }}
            className="w-full rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-3 text-sm font-bold text-navy focus:border-primary"
          >
            <option value="">اختر المرحلة *</option>
            {Object.values(STAGES).map((s) => (
              <option key={s.key} value={s.key}>
                {s.stageTitle}
              </option>
            ))}
          </select>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            disabled={!stage}
            className="w-full rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-3 text-sm font-bold text-navy focus:border-primary disabled:bg-navy/5"
          >
            <option value="">اختر الصف *</option>
            {grades.map((g) => (
              <option key={g.key} value={g.label}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mt-3 rounded-xl bg-error/10 px-4 py-3 text-sm font-bold text-error">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-xl bg-success px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-success/90 disabled:opacity-50"
        >
          {saving ? "جاري الإنشاء..." : "إنشاء الطالب + كود الدخول"}
        </button>
      </form>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 ابحثي بالاسم أو الكود..."
        className="mt-6 w-full max-w-md rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-2.5 text-sm text-navy placeholder:text-navy/40 focus:border-primary"
      />

      {/* Students List */}
      <div className="mt-4 flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl bg-white/70 p-8 text-center text-sm font-bold text-navy/40 backdrop-blur-lg">
            لا يوجد طلاب بعد
          </div>
        )}
        {filtered.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-lg"
          >
            <div className="min-w-0">
              <p className="truncate font-extrabold text-navy">{s.full_name}</p>
              <p className="mt-0.5 text-xs text-navy/50">
                {STAGES[s.stage]?.stageTitle || s.stage} — {s.grade}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                dir="ltr"
                className="rounded-xl bg-navy/5 px-4 py-2 text-lg font-extrabold tracking-widest text-primary"
              >
                {s.student_code}
              </span>
              <CopyCodeButton code={s.student_code} />
              <button
                onClick={() => handleDelete(s)}
                className="rounded-lg p-2 text-error transition-colors hover:bg-error/10"
                title="حذف الطالب"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Student Code Modal */}
      {createdStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
            <span className="text-5xl">🎉</span>
            <h2 className="mt-3 text-xl font-extrabold text-navy">
              تم إنشاء الطالب بنجاح
            </h2>
            <div className="mt-5 space-y-2 rounded-2xl bg-navy/5 p-5">
              <p className="font-extrabold text-navy">{createdStudent.full_name}</p>
              <p className="text-sm text-navy/60">
                {STAGES[createdStudent.stage]?.stageTitle || createdStudent.stage} —{" "}
                {createdStudent.grade}
              </p>
              <p
                dir="ltr"
                className="my-3 text-4xl font-extrabold tracking-[0.35em] text-primary"
              >
                {createdStudent.student_code}
              </p>
              <p className="text-xs text-navy/50">كود الدخول الخاص بالطالب</p>
            </div>
            <div className="mt-5 flex gap-3">
              <CopyCodeButton code={createdStudent.student_code} />
              <button
                onClick={() => setCreatedStudent(null)}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
              >
                تم
              </button>
            </div>
            <p className="mt-4 text-xs text-navy/40">
              ⚠️ أعطي الكود للطالب — يُستخدم في صفحة "دخول الطالب". ويمكن عرضه مرة أخرى من قائمة الطلاب.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
