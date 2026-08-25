import { supabase } from "./supabase";
import {
  getSelectedChoiceIds,
  isMultiChoiceQuestion,
} from "./answerUtils";

// ============ Exams ============

export async function fetchExams() {
  const { data, error } = await supabase
    .from("exams")
    .select("*, questions(count)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * عدد الأسئلة الحقيقي للامتحان — مستقل عن total_score.
 * يدعم كل الأشكال الفعلية:
 * - questions(count) من Supabase → questions: [{ count }]
 * - صفوف كاملة من fetchQuestions → questions: [ ...rows ]
 * - حقل questions_count إن وُجد
 */
export function getExamQuestionCount(exam) {
  if (!exam) return 0;
  if (exam.questions_count != null && Number.isFinite(Number(exam.questions_count))) {
    return Number(exam.questions_count);
  }
  if (Array.isArray(exam.questions)) {
    // شكل questions(count): عنصر واحد فيه العدد
    if (
      exam.questions.length === 1 &&
      typeof exam.questions[0]?.count === "number" &&
      !exam.questions[0]?.id
    ) {
      return exam.questions[0].count;
    }
    // صفوف أسئلة كاملة
    return exam.questions.length;
  }
  return 0;
}

export async function fetchPublishedExams(stage, grade) {
  const { data, error } = await supabase
    .from("exams")
    .select("*, questions(count)")
    .eq("status", "published")
    .eq("stage", stage)
    .eq("grade", grade)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchExamById(id) {
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createExam(exam) {
  const { data, error } = await supabase
    .from("exams")
    .insert(exam)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExam(id, updates) {
  const { data, error } = await supabase
    .from("exams")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExam(id) {
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) throw error;
}

// ============ Questions ============

export async function fetchQuestions(examId) {
  const { data, error } = await supabase
    .from("questions")
    .select("*, choices(*)")
    .eq("exam_id", examId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createQuestion(question) {
  const { data, error } = await supabase
    .from("questions")
    .insert(question)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateQuestion(id, updates) {
  const { data, error } = await supabase
    .from("questions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteQuestion(id) {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderQuestions(updates) {
  const { error } = await supabase.from("questions").upsert(updates);
  if (error) throw error;
}

// ============ Choices ============

export async function createChoices(choices) {
  const { data, error } = await supabase
    .from("choices")
    .insert(choices)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteChoicesByQuestion(questionId) {
  const { error } = await supabase
    .from("choices")
    .delete()
    .eq("question_id", questionId);
  if (error) throw error;
}

// ============ Attempts ============

export async function createAttempt(examId, studentName, stage, grade, studentId = null) {
  // Generate a unique client token for this attempt
  const clientToken = crypto.randomUUID();

  const payload = {
    exam_id: examId,
    student_name: studentName,
    stage,
    grade,
    status: "in_progress",
    started_at: new Date().toISOString(),
    client_token: clientToken,
  };
  // اربط المحاولة بحساب الطالب إذا كان مسجلًا بالكود (اختياري — لا يؤثر على النتائج القديمة)
  if (studentId) payload.student_id = studentId;

  const { data, error } = await supabase
    .from("attempts")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchAttempt(attemptId) {
  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchAttemptByToken(clientToken) {
  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .eq("client_token", clientToken)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateAttempt(id, updates) {
  const { data, error } = await supabase
    .from("attempts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchAttempts(filters = {}) {
  let query = supabase
    .from("attempts")
    .select("*, exams(title, stage, grade)")
    .in("status", ["submitted", "auto_submitted"])
    .order("submitted_at", { ascending: false });

  if (filters.stage) query = query.eq("stage", filters.stage);
  if (filters.grade) query = query.eq("grade", filters.grade);
  if (filters.examId) query = query.eq("exam_id", filters.examId);
  if (filters.minPercentage != null)
    query = query.gte("percentage", filters.minPercentage);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * بدء/استئناف محاولة الطالب عبر RPC الخلفي start_attempt.
 * يفرض من الخادم: امتحان منشور + مطابقة stage/grade المخزنة للطالب +
 * قاعدة Student + Exam = Attempt واحدة.
 * الأخطاء المعروفة: already_attempted / not_allowed / exam_not_available /
 * student_not_found / student_inactive / expired-related handled at submit.
 */
export async function startStudentAttempt(examId, student) {
  const { data, error } = await supabase.rpc("start_attempt", {
    p_exam_id: examId,
    p_student_id: student.id,
    p_client_token: crypto.randomUUID(),
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("already_attempted")) {
      throw Object.assign(new Error("لقد قمت بأداء هذا الاختبار من قبل."), {
        code: "ALREADY_ATTEMPTED",
      });
    }
    if (msg.includes("not_allowed")) {
      throw Object.assign(
        new Error("هذا الاختبار خارج مرحلتك أو صفك الدراسي."),
        { code: "NOT_ALLOWED" }
      );
    }
    if (msg.includes("student_inactive")) {
      throw Object.assign(new Error("هذا الحساب موقوف. راجعي المدرسة."), {
        code: "STUDENT_INACTIVE",
      });
    }
    if (
      msg.includes("exam_not_available") ||
      msg.includes("exam_not_found")
    ) {
      throw Object.assign(new Error("هذا الاختبار غير متاح حاليًا."), {
        code: "EXAM_UNAVAILABLE",
      });
    }
    throw error;
  }

  return Array.isArray(data) ? data[0] : data;
}

/** خريطة exam_id -> status لمحاولات طالب معين (لعرض حالة الامتحانات) */
export async function fetchStudentAttemptMap(studentId) {
  const { data, error } = await supabase
    .from("attempts")
    .select("exam_id, status")
    .eq("student_id", studentId);
  if (error) throw error;
  const map = new Map();
  for (const row of data || []) map.set(row.exam_id, row.status);
  return map;
}

// ============ Answers ============

export async function saveAnswer(attemptId, questionId, choiceIds) {
  const { data, error } = await supabase
    .from("answers")
    .upsert(
      {
        attempt_id: attemptId,
        question_id: questionId,
        selected_choice_ids: choiceIds,
      },
      { onConflict: "attempt_id,question_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertAnswer(answer) {
  const { data, error } = await supabase
    .from("answers")
    .upsert(answer, { onConflict: "attempt_id,question_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchAnswers(attemptId) {
  const { data, error } = await supabase
    .from("answers")
    .select("*")
    .eq("attempt_id", attemptId);
  if (error) throw error;
  return data;
}

// ============ Dashboard Stats ============

export async function fetchDashboardStats() {
  const [examsRes, publishedRes, attemptsRes, topRes] = await Promise.all([
    supabase.from("exams").select("id", { count: "exact", head: true }),
    supabase
      .from("exams")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("attempts")
      .select("id, percentage", { count: "exact" })
      .in("status", ["submitted", "auto_submitted"]),
    supabase
      .from("attempts")
      .select("id", { count: "exact", head: true })
      .in("status", ["submitted", "auto_submitted"])
      .gte("percentage", 90),
  ]);

  if (examsRes.error) throw examsRes.error;
  if (publishedRes.error) throw publishedRes.error;
  if (attemptsRes.error) throw attemptsRes.error;
  if (topRes.error) throw topRes.error;

  const attempts = attemptsRes.data || [];
  const avg =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + Number(a.percentage), 0) /
        attempts.length
      : 0;

  return {
    totalExams: examsRes.count ?? 0,
    publishedExams: publishedRes.count ?? 0,
    totalAttempts: attemptsRes.count ?? 0,
    topStudents: topRes.count ?? 0,
    averagePercentage: Math.round(avg * 10) / 10,
  };
}

// ============ Submit Attempt ============

/**
 * تسليم المحاولة — آمن ومكرر-المنع:
 * 1) يحاول submit_attempt RPC (تحقق الخادم من الوقت والحالة + تصحيح SQL)
 * 2) إذا لم تكن الدالة موجودة بعد (لم ينفذ أحد ملف enforce_attempt_rules.sql)
 *    يرجع للمسار القديم المتوافق
 * يدوي بعد انتهاء الوقت → يعاد كـ auto تلقائيًا (وقت الانتهاء فرضه الخادم)
 */
export async function submitAttempt(attemptId, answers, isAuto = false) {
  const payload = {};
  for (const [questionId, choiceIds] of Object.entries(answers || {})) {
    if (Array.isArray(choiceIds) && choiceIds.length > 0) {
      payload[questionId] = choiceIds;
    }
  }

  try {
    return await submitAttemptRpc(attemptId, payload, isAuto);
  } catch (err) {
    // الدالة غير منشأة بعد → المسار القديم
    if (err?.code === "RPC_MISSING") {
      console.warn("submit_attempt RPC missing, using legacy client submit");
      return legacySubmitAttempt(attemptId, answers, isAuto);
    }
    // تسليم يدوي بعد انتهاء الوقت: يقبل كتسليم تلقائي
    if (err?.code === "EXPIRED" && !isAuto) {
      return submitAttemptRpc(attemptId, payload, true);
    }
    throw err;
  }
}

async function submitAttemptRpc(attemptId, payload, isAuto) {
  const { data, error } = await supabase.rpc("submit_attempt", {
    p_attempt_id: attemptId,
    p_answers: payload,
    p_is_auto: isAuto,
  });

  if (error) {
    const msg = error.message || "";
    if (error.code === "PGRST202" || msg.includes("does not exist")) {
      throw Object.assign(new Error("rpc missing"), { code: "RPC_MISSING" });
    }
    if (msg.includes("already_submitted")) {
      throw Object.assign(new Error("already submitted"), {
        code: "ALREADY_SUBMITTED",
      });
    }
    if (msg.includes("expired")) {
      throw Object.assign(new Error("انتهى وقت الاختبار."), { code: "EXPIRED" });
    }
    throw error;
  }

  return Array.isArray(data) ? data[0] : data;
}

// المسار القديم (متوافق مع النظام الحالي قبل تنفيذ الـ RPC)
async function legacySubmitAttempt(attemptId, answers, isAuto = false) {
  // 1. Fetch the attempt to verify it's still in_progress
  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .select("*, exams(*)")
    .eq("id", attemptId)
    .single();

  if (attemptError) throw attemptError;
  if (attempt.status !== "in_progress") {
    throw new Error("already submitted");
  }

  // 2. Fetch all questions with choices for this exam
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("*, choices(*)")
    .eq("exam_id", attempt.exam_id)
    .order("sort_order", { ascending: true });

  if (questionsError) throw questionsError;

  // 3. Calculate score, correct/wrong/unanswered counts
  let totalScore = 0;
  let earnedScore = 0;
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let unanswered = 0;

  for (const question of questions) {
    totalScore += question.score;
    const selectedIds = getSelectedChoiceIds({ selected_choice_ids: answers[question.id] });
    const correctIds = question.choices
      .filter((c) => c.is_correct)
      .map((c) => c.id);

    // Determine if the student answered the question
    const hasAnswer = selectedIds.length > 0;

    if (!hasAnswer) {
      // Question was not answered
      unanswered += 1;
      // No score, no correct/wrong counting
      continue;
    }

    // Check if answer is correct
    let isCorrect = false;
    if (isMultiChoiceQuestion(question)) {
      // For multiple choice: all correct must be selected, no incorrect
      isCorrect =
        selectedIds.length === correctIds.length &&
        selectedIds.every((id) => correctIds.includes(id));
    } else {
      // For single choice / true-false: exactly one correct selected
      isCorrect =
        selectedIds.length === 1 && correctIds.includes(selectedIds[0]);
    }

    if (isCorrect) {
      earnedScore += question.score;
      correctAnswers += 1;
    } else {
      wrongAnswers += 1;
    }
  }

  const percentage =
    totalScore > 0 ? Math.round((earnedScore / totalScore) * 100) : 0;

  // 4. Update attempt with results
  const { data: updatedAttempt, error: updateError } = await supabase
    .from("attempts")
    .update({
      status: isAuto ? "auto_submitted" : "submitted",
      submitted_at: new Date().toISOString(),
      score: earnedScore,
      total_score: totalScore,
      percentage,
    })
    .eq("id", attemptId)
    .eq("status", "in_progress") // Prevent duplicate submission
    .select()
    .single();

  if (updateError) {
    if (updateError.code === "PGRST116") {
      throw Object.assign(new Error("already submitted"), {
        code: "ALREADY_SUBMITTED",
      });
    }
    throw updateError;
  }

  // 5. Upsert answers table with the student's actual selections + is_correct and score_earned.
  // This ensures Admin Dashboard can display per-question details.
  // Only upsert answers for questions the student actually answered (hasAnswer = true)
  // Unanswered questions should remain absent from the answers table so Admin can count them
  const answersToUpdate = [];
  for (const question of questions) {
    const selectedIds = getSelectedChoiceIds({ selected_choice_ids: answers[question.id] });
    const correctIds = question.choices
      .filter((c) => c.is_correct)
      .map((c) => c.id);

    let isCorrect = false;
    let scoreEarned = 0;
    const hasAnswer = selectedIds.length > 0;

    if (hasAnswer) {
      if (isMultiChoiceQuestion(question)) {
        isCorrect =
          selectedIds.length === correctIds.length &&
          selectedIds.every((id) => correctIds.includes(id));
      } else {
        isCorrect =
          selectedIds.length === 1 && correctIds.includes(selectedIds[0]);
      }
      scoreEarned = isCorrect ? question.score : 0;

      answersToUpdate.push({
        attempt_id: attemptId,
        question_id: question.id,
        selected_choice_ids: selectedIds,
        is_correct: isCorrect,
        score_earned: scoreEarned,
      });
    }
    // else: question was not answered, skip upsert so it stays absent from answers table
    // Admin calculates unanswered as: questions.length - answers.length
  }

  // Upsert all answered questions (will update existing or insert new).
  // Non-fatal: a failure here must never block or invalidate the submitted score.
  if (answersToUpdate.length > 0) {
    try {
      const { error: answersError } = await supabase
        .from("answers")
        .upsert(answersToUpdate, { onConflict: "attempt_id,question_id" });

      if (answersError) throw answersError;
    } catch (answersError) {
      console.error("Failed to persist answers:", answersError);
    }
  }

  return updatedAttempt;
}

// ============ Top Students ============

/**
 * محو بيانات المنصة (طلاب/امتحانات/أسئلة/محاولات/نتائج) عبر RPC خلفي.
 * الأدمن المصادق فقط — الدالة ترفض أي مستخدم آخر من الخادم.
 * يعيد عدادات ما بعد المحو (يجب أن تكون كلها صفرًا).
 */
export async function resetExamPlatformData() {
  const { data, error } = await supabase.rpc("reset_exam_platform_data");
  if (error) {
    if ((error.message || "").includes("unauthorized")) {
      throw Object.assign(new Error("غير مصرح لك بهذه العملية."), {
        code: "UNAUTHORIZED",
      });
    }
    throw error;
  }
  return Array.isArray(data) ? data[0] : data;
}

export async function fetchTopStudents() {
  const { data, error } = await supabase
    .from("attempts")
    .select("*, exams(title, stage, grade)")
    .in("status", ["submitted", "auto_submitted"])
    .gte("percentage", 90)
    .order("percentage", { ascending: false })
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data;
}
