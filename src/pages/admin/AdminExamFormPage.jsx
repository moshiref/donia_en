import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createExam,
  updateExam,
  fetchExamById,
  fetchQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createChoices,
  deleteChoicesByQuestion,
  reorderQuestions,
} from "../../lib/examService";
import { supabase } from "../../lib/supabase";
import { STAGES } from "../../data/stages";

const QUESTION_TYPES = [
  { value: "mcq", label: "اختيار من متعدد", icon: "🔘" },
  { value: "true_false", label: "صح أو غلط", icon: "✅" },
  { value: "image", label: "سؤال بصورة", icon: "🖼️" },
  { value: "multi_select", label: "اختيار أكثر من إجابة", icon: "☑️" },
];

function emptyQuestion(sortOrder) {
  return {
    _id: crypto.randomUUID(),
    question_text: "",
    question_type: "mcq",
    image_url: "",
    score: 1,
    sort_order: sortOrder,
    choices: [
      { _id: crypto.randomUUID(), choice_text: "", is_correct: false, sort_order: 0 },
      { _id: crypto.randomUUID(), choice_text: "", is_correct: false, sort_order: 1 },
      { _id: crypto.randomUUID(), choice_text: "", is_correct: false, sort_order: 2 },
      { _id: crypto.randomUUID(), choice_text: "", is_correct: false, sort_order: 3 },
    ],
    _isNew: true,
  };
}

export default function AdminExamFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  // Step 1: exam data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState("");
  const [grade, setGrade] = useState("");
  const [duration, setDuration] = useState(20);

  // Step 2: questions
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEdit);

  const totalScore = questions.reduce((sum, q) => sum + (Number(q.score) || 0), 0);
  const grades = stage ? STAGES[stage]?.grades || [] : [];

  useEffect(() => {
    if (!isEdit) return;
    async function load() {
      try {
        const [exam, qs] = await Promise.all([fetchExamById(id), fetchQuestions(id)]);
        setTitle(exam.title);
        setDescription(exam.description || "");
        setStage(exam.stage);
        setGrade(exam.grade);
        setDuration(exam.duration_minutes);
        setQuestions(
          qs.map((q) => ({
            ...q,
            _id: q.id,
            choices: (q.choices || [])
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((c) => ({ ...c, _id: c.id })),
            _isNew: false,
          }))
        );
      } catch (err) {
        setError("حدث خطأ أثناء تحميل الاختبار");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isEdit]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion(prev.length)]);
  };

  const removeQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQ = (index, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const updateChoice = (qIndex, cIndex, field, value) => {
    setQuestions((prev) =>
      prev.map((q, qi) =>
        qi === qIndex
          ? {
              ...q,
              choices: q.choices.map((c, ci) => {
                if (ci !== cIndex) {
                  // For MCQ, only one correct answer
                  if (field === "is_correct" && value && q.question_type === "mcq") {
                    return { ...c, is_correct: false };
                  }
                  return c;
                }
                return { ...c, [field]: value };
              }),
            }
          : q
      )
    );
  };

  const moveQuestion = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= questions.length) return;
    setQuestions((prev) => {
      const arr = [...prev];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  };

  const handleTypeChange = (qIndex, newType) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        if (newType === "true_false") {
          return {
            ...q,
            question_type: newType,
            choices: [
              { _id: crypto.randomUUID(), choice_text: "صح", is_correct: false, sort_order: 0 },
              { _id: crypto.randomUUID(), choice_text: "غلط", is_correct: false, sort_order: 1 },
            ],
          };
        }
        if (q.choices.length < 4) {
          const newChoices = [...q.choices];
          while (newChoices.length < 4) {
            newChoices.push({
              _id: crypto.randomUUID(),
              choice_text: "",
              is_correct: false,
              sort_order: newChoices.length,
            });
          }
          return { ...q, question_type: newType, choices: newChoices };
        }
        return { ...q, question_type: newType };
      })
    );
  };

  const validate = () => {
    if (!title.trim()) return "اسم الاختبار مطلوب";
    if (!stage) return "اختر المرحلة";
    if (!grade) return "اختر الصف";
    if (!duration || duration < 1) return "مدة الاختبار مطلوبة";
    if (questions.length === 0) return "أضف سؤالًا واحدًا على الأقل";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) return `السؤال ${i + 1}: نص السؤال مطلوب`;
      if (!q.score || q.score < 1) return `السؤال ${i + 1}: الدرجة يجب أن تكون 1 أو أكثر`;
      const hasCorrect = q.choices.some((c) => c.is_correct);
      if (!hasCorrect) return `السؤال ${i + 1}: حدد الإجابة الصحيحة`;
      if (q.question_type !== "true_false") {
        for (let j = 0; j < q.choices.length; j++) {
          if (!q.choices[j].choice_text.trim())
            return `السؤال ${i + 1}: الاختيار ${j + 1} فارغ`;
        }
      }
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setSaving(true);

    try {
      let examId = id;

      // 1) Save exam
      const examData = {
        title: title.trim(),
        description: description.trim() || null,
        stage,
        grade,
        duration_minutes: duration,
        total_score: totalScore,
      };

      if (isEdit) {
        await updateExam(examId, examData);
      } else {
        const newExam = await createExam(examData);
        examId = newExam.id;
      }

      // 2) Get existing question IDs to detect deletions
      if (isEdit) {
        const existingQuestions = await fetchQuestions(examId);
        const currentIds = new Set(questions.filter((q) => !q._isNew).map((q) => q.id));
        for (const eq of existingQuestions) {
          if (!currentIds.has(eq.id)) {
            await deleteQuestion(eq.id);
          }
        }
      }

      // 3) Save questions & choices
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qData = {
          exam_id: examId,
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          image_url: q.image_url || null,
          score: Number(q.score),
          sort_order: i,
        };

        let questionId;
        if (q._isNew) {
          const created = await createQuestion(qData);
          questionId = created.id;
        } else {
          await updateQuestion(q.id, qData);
          questionId = q.id;
          await deleteChoicesByQuestion(questionId);
        }

        const choicesData = q.choices.map((c, ci) => ({
          question_id: questionId,
          choice_text: c.choice_text.trim(),
          is_correct: c.is_correct,
          sort_order: ci,
        }));
        await createChoices(choicesData);
      }

      // 4) Refresh total score
      await supabase.rpc("refresh_exam_total_score", { p_exam_id: examId });

      navigate("/admin/exams");
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء حفظ الاختبار. حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-navy/60">جاري تحميل الاختبار...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-navy">
        {isEdit ? "✏️ تعديل الاختبار" : "➕ إنشاء اختبار جديد"}
      </h1>

      {/* Steps indicator */}
      <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
            step === 1 ? "bg-primary text-white" : "bg-navy/5 text-navy/60"
          }`}
        >
          1️⃣ بيانات الاختبار
        </button>
        <div className="hidden h-px w-8 bg-navy/20 sm:block" />
        <button
          onClick={() => setStep(2)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
            step === 2 ? "bg-primary text-white" : "bg-navy/5 text-navy/60"
          }`}
        >
          2️⃣ الأسئلة ({questions.length})
        </button>
        <div className="hidden h-px w-8 bg-navy/20 sm:block" />
        <div className="rounded-xl bg-navy/5 px-4 py-2 text-sm font-bold text-navy">
          🎯 الدرجة النهائية: {totalScore} درجة
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-error/10 px-4 py-3 text-sm font-bold text-error">
          {error}
        </div>
      )}

      {/* Step 1: Exam Data */}
      {step === 1 && (
        <div className="mt-6 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-lg">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-bold text-navy">اسم الاختبار *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-3 text-navy focus:border-primary"
                placeholder="مثال: اختبار الوحدة الأولى"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-bold text-navy">وصف الاختبار (اختياري)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-3 text-navy focus:border-primary"
                placeholder="وصف مختصر للاختبار..."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-navy">المرحلة *</label>
              <div className="flex flex-wrap gap-3">
                {Object.values(STAGES).map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => { setStage(s.key); setGrade(""); }}
                    className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                      stage === s.key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-navy/10 bg-white/80 text-navy/60 hover:border-primary/30"
                    }`}
                  >
                    {s.icon} {s.stageTitle}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-navy">الصف *</label>
              <div className="flex flex-wrap gap-2">
                 {grades.map((g) => (
                   <button
                     key={g.key}
                     type="button"
                     onClick={() => setGrade(g.label)}
                    className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all ${
                       grade === g.label
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-navy/10 bg-white/80 text-navy/60 hover:border-primary/30"
                    }`}
                  >
                     {g.label}
                  </button>
                ))}
                {!stage && <p className="text-sm text-navy/40">اختر المرحلة أولاً</p>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-navy">⏱️ مدة الاختبار (بالدقائق) *</label>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-3 text-navy focus:border-primary"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="rounded-2xl bg-gradient-to-l from-primary to-purple px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95"
            >
              التالي: الأسئلة ←
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Questions */}
      {step === 2 && (
        <div className="mt-6">
          {questions.map((q, qIndex) => (
            <div
              key={q._id}
              className="mb-4 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-lg"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-navy">
                  سؤال {qIndex + 1}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveQuestion(qIndex, -1)}
                    disabled={qIndex === 0}
                    className="rounded-lg p-2 text-sm transition-colors hover:bg-primary/10 disabled:opacity-30"
                    title="تحريك لأعلى"
                  >
                    ⬆️
                  </button>
                  <button
                    onClick={() => moveQuestion(qIndex, 1)}
                    disabled={qIndex === questions.length - 1}
                    className="rounded-lg p-2 text-sm transition-colors hover:bg-primary/10 disabled:opacity-30"
                    title="تحريك لأسفل"
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    className="rounded-lg p-2 text-sm transition-colors hover:bg-error/10"
                    title="حذف السؤال"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-bold text-navy">نص السؤال *</label>
                  <textarea
                    value={q.question_text}
                    onChange={(e) => updateQ(qIndex, "question_text", e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-3 text-navy focus:border-primary"
                    placeholder="اكتب السؤال هنا..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-navy">نوع السؤال</label>
                  <div className="flex flex-wrap gap-2">
                    {QUESTION_TYPES.map((qt) => (
                      <button
                        key={qt.value}
                        type="button"
                        onClick={() => handleTypeChange(qIndex, qt.value)}
                        className={`rounded-xl border-2 px-3 py-2 text-xs font-bold transition-all ${
                          q.question_type === qt.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-navy/10 bg-white/80 text-navy/60"
                        }`}
                      >
                        {qt.icon} {qt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-navy">درجة السؤال *</label>
                  <input
                    type="number"
                    min={1}
                    value={q.score}
                    onChange={(e) => updateQ(qIndex, "score", e.target.value)}
                    className="w-24 rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-2.5 text-navy focus:border-primary"
                  />
                </div>

                {q.question_type === "image" && (
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-bold text-navy">رابط الصورة</label>
                    <input
                      type="url"
                      value={q.image_url || ""}
                      onChange={(e) => updateQ(qIndex, "image_url", e.target.value)}
                      dir="ltr"
                      className="w-full rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-3 text-navy focus:border-primary"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                )}

                {/* Choices */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-navy">الاختيارات</label>
                  <div className="flex flex-col gap-2">
                    {q.choices.map((c, cIndex) => (
                      <div key={c._id} className="flex items-center gap-3">
                        {q.question_type === "multi_select" ? (
                          <input
                            type="checkbox"
                            checked={c.is_correct}
                            onChange={(e) => updateChoice(qIndex, cIndex, "is_correct", e.target.checked)}
                            className="h-5 w-5 rounded border-2 border-primary/30 text-primary focus:ring-primary"
                          />
                        ) : (
                          <input
                            type="radio"
                            name={`correct-${q._id}`}
                            checked={c.is_correct}
                            onChange={() => updateChoice(qIndex, cIndex, "is_correct", true)}
                            className="h-5 w-5 border-2 border-primary/30 text-primary focus:ring-primary"
                          />
                        )}
                        <input
                          type="text"
                          value={c.choice_text}
                          onChange={(e) => updateChoice(qIndex, cIndex, "choice_text", e.target.value)}
                          disabled={q.question_type === "true_false"}
                          className="flex-1 rounded-xl border-2 border-primary/20 bg-white/90 px-4 py-2.5 text-navy focus:border-primary disabled:bg-navy/5"
                          placeholder={`الاختيار ${cIndex + 1}`}
                        />
                        {c.is_correct && (
                          <span className="text-sm font-bold text-success">✅ صحيحة</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addQuestion}
            className="w-full rounded-2xl border-2 border-dashed border-primary/30 bg-white/50 py-4 text-sm font-bold text-primary transition-colors hover:border-primary hover:bg-primary/5"
          >
            ➕ إضافة سؤال جديد
          </button>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setStep(1)}
              className="rounded-2xl border-2 border-navy/20 px-6 py-3 text-sm font-bold text-navy transition-colors hover:bg-navy/5"
            >
              → السابق
            </button>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="text-sm font-bold text-navy">
                🎯 الدرجة النهائية: {totalScore} درجة
              </span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-2xl bg-gradient-to-l from-success to-success/80 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-success/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 sm:px-8"
              >
                {saving ? "جاري الحفظ..." : isEdit ? "💾 حفظ التعديلات" : "💾 حفظ الاختبار"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
