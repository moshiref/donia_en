import { supabase } from "./supabase";

// ============ Exams ============

export async function fetchExams() {
  const { data, error } = await supabase
    .from("exams")
    .select("*, questions(count)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
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

export async function createAttempt(examId, studentName, stage, grade) {
  // Generate a unique client token for this attempt
  const clientToken = crypto.randomUUID();
  
  const { data, error } = await supabase
    .from("attempts")
    .insert({
      exam_id: examId,
      student_name: studentName,
      stage,
      grade,
      status: "in_progress",
      started_at: new Date().toISOString(),
      client_token: clientToken,
    })
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

export async function submitAttempt(attemptId, answers, isAuto = false) {
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

  // 3. Calculate score
  let totalScore = 0;
  let earnedScore = 0;

  for (const question of questions) {
    totalScore += question.score;
    const selectedIds = answers[question.id] || [];
    const correctIds = question.choices
      .filter((c) => c.is_correct)
      .map((c) => c.id);

    // Check if answer is correct
    let isCorrect = false;
    if (question.question_type === "multiple") {
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
      throw new Error("already submitted");
    }
    throw updateError;
  }

  return updatedAttempt;
}

// ============ Top Students ============

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
