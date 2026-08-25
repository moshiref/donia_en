// ============================================================
// أدوات قراءة إجابات الطلاب — تدعم كل الصيغ القديمة والحديثة
// الموجودة فعليًا في المشروع دون تعديل أي بيانات محفوظة.
//
// الصيغ المدعومة في جدول answers:
// 1) صفوف بها selected_choice_ids (مصفوفة UUIDs) — الصيغة الحالية
// 2) صفوف قديمة بها is_correct / score_earned فقط بدون اختيارات
// 3) محاولات قديمة بلا أي صفوف إجابات (تم فيها حفظ الدرجة فقط)
// ============================================================

/**
 * يستخرج اختيارات الطالب من صف الإجابة بأي صيغة معروفة.
 * لا يعتبر القيم الفارغة (null / undefined / "" ) إجابة.
 */
export function getSelectedChoiceIds(answer) {
  const raw = answer?.selected_choice_ids;
  if (raw == null) return [];

  if (Array.isArray(raw)) {
    return raw.filter((id) => typeof id === "string" && id.length > 0);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "{}") return [];
    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      // Postgres array literal مثل: {uuid-1,uuid-2}
      return trimmed
        .replace(/^\{/, "")
        .replace(/\}$/, "")
        .split(",")
        .map((s) => s.trim().replace(/^"|"/g, ""))
        .filter(Boolean);
    }
    if (Array.isArray(parsed)) {
      return parsed.filter((id) => typeof id === "string" && id.length > 0);
    }
    return [];
  }

  return [];
}

/** هل السؤال يقبل أكثر من اختيار؟ (يدعم اسم النوع القديم "multiple") */
export function isMultiChoiceQuestion(question) {
  const t = question?.question_type;
  return t === "multi_select" || t === "multiple";
}

/**
 * يقيّم إجابة الطالب على سؤال واحد من البيانات الفعلية المتاحة.
 * يعيد { answered, correct, selectedIds }
 * - answered=false تعني: لا توجد بيانات تثبت أن الطالب أجاب.
 */
export function evaluateAnswer(answer, question) {
  if (!answer) {
    return { answered: false, correct: null, selectedIds: [] };
  }

  const selectedIds = getSelectedChoiceIds(answer);

  if (selectedIds.length > 0 && question?.choices?.length) {
    const correctChoices = question.choices.filter((c) => c.is_correct);
    let correct;
    if (isMultiChoiceQuestion(question)) {
      correct =
        selectedIds.length === correctChoices.length &&
        selectedIds.every((id) =>
          correctChoices.some((c) => c.id === id)
        );
    } else {
      correct =
        selectedIds.length === 1 &&
        correctChoices.some((c) => c.id === selectedIds[0]);
    }
    return { answered: true, correct, selectedIds };
  }

  // صيغة قديمة: صف إجابة بدون اختيارات لكن بحالة تصحيح محفوظة
  if (typeof answer.is_correct === "boolean") {
    return { answered: true, correct: answer.is_correct, selectedIds: [] };
  }

  return { answered: false, correct: null, selectedIds: [] };
}

/** الدرجة المعروضة للسؤال: تُفضل القيمة المحفوظة ولا تعيد حساب الدرجات المحفوظة */
export function resolveScoreEarned(answer, question, evaluation) {
  if (!evaluation.answered) return 0;
  if (answer?.score_earned != null && answer.score_earned !== "") {
    const n = Number(answer.score_earned);
    if (Number.isFinite(n)) return n;
  }
  return evaluation.correct ? Number(question?.score) || 0 : 0;
}

/**
 * يحسب إحصائيات المحاولة (صحيحة/خاطئة/بدون إجابة) من إجابات الطالب الفعلية.
 *
 * للنتائج القديمة التي لا تحتوي أي صفوف إجابات على الإطلاق (بياناتها
 * التفصيلية لم تُحفظ بسبب مشكلة الصلاحيات السابقة)، وإذا كانت كل أسئلة
 * الاختبار بنفس الدرجة، تُشتق الإحصائيات من الدرجة النهائية المحفوظة
 * كما هي في قاعدة البيانات (بدون أي تعديل عليها)، ويُعلَّم ذلك بـ
 * inferred حتى يمكن عرض تنويه للمستخدم.
 *
 * @returns {{correct:number, wrong:number, unanswered:number, inferred:boolean}}
 */
export function computeAttemptStats(questions, answers, earnedScore = null) {
  const answerByQuestion = new Map();
  for (const a of answers || []) {
    if (a?.question_id) answerByQuestion.set(a.question_id, a);
  }

  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  if (answers && answers.length > 0) {
    for (const q of questions) {
      const evaluation = evaluateAnswer(answerByQuestion.get(q.id), q);
      if (!evaluation.answered) unanswered += 1;
      else if (evaluation.correct) correct += 1;
      else wrong += 1;
    }
    return { correct, wrong, unanswered, inferred: false };
  }

  // لا توجد أي صفوف إجابات — نتيجة قديمة حفظت درجتها فقط
  const scores = questions.map((q) => Number(q.score));
  const unit = scores[0];
  const uniform =
    questions.length > 0 &&
    scores.every((s) => Number.isFinite(s) && s > 0 && s === unit);

  const total = Number(earnedScore);
  if (
    uniform &&
    Number.isFinite(total) &&
    total >= 0 &&
    total % unit === 0 &&
    total <= unit * questions.length
  ) {
    correct = total / unit;
    wrong = 0;
    unanswered = questions.length - correct;
    return { correct, wrong, unanswered, inferred: true };
  }

  return {
    correct: 0,
    wrong: 0,
    unanswered: questions.length,
    inferred: false,
  };
}
