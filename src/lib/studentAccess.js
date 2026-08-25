import { STAGES } from "../data/stages";

// ============================================================
// صلاحيات الطالب — المرحلة والصف محددان مسبقًا من الإدارة فقط
// المصدر الرسمي: students.stage (مفتاح) + students.grade (التسمية)
// نفس التنسيق المستخدم في جدول exams (stage=key, grade=label)
// ============================================================

/**
 * يعيد نطاق الطالب المسموح به بعد التحقق من البيانات الفعلية.
 * لا يخمّن: إذا كانت البيانات ناقصة أو غير مطابقة يمنع الوصول.
 */
export function getStudentAccess(student) {
  if (!student || !student.stage || !student.grade) {
    return { allowed: false, reason: "not_assigned" };
  }

  const stageConfig = STAGES[student.stage];
  if (!stageConfig) {
    return { allowed: false, reason: "invalid_stage" };
  }

  const grade = stageConfig.grades.find((g) => g.label === student.grade);
  if (!grade) {
    return { allowed: false, reason: "invalid_grade" };
  }

  return {
    allowed: true,
    reason: null,
    stageKey: stageConfig.key,
    stageConfig,
    grade,
  };
}

/** هل يُسمح للطالب بفتح هذا الامتحان تحديدًا؟ (تحقق نهائي قبل البدء) */
export function canStudentOpenExam(student, exam) {
  if (!student || !exam) return false;
  const access = getStudentAccess(student);
  return (
    access.allowed &&
    exam.stage === student.stage &&
    exam.grade === student.grade
  );
}

/** مسار امتحانات الطالب المسموح بها، أو null إن لم تكن له صلاحية */
export function getStudentExamsPath(student) {
  const access = getStudentAccess(student);
  if (!access.allowed) return null;
  return `/exams/${access.stageKey}/${access.grade.key}`;
}
