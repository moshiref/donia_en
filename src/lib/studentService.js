import { supabase } from "./supabase";

// ============================================================
// خدمة الطلاب — إنشاء الطلاب وأكواد الدخول من لوحة التحكم فقط
// ============================================================

const CODE_LENGTH = 6;
const MAX_CODE_RETRIES = 10;

/** يولد كودًا عشوائيًا من 6 أرقام فقط (بدون حروف أو رموز وبدون أصفار بادئة) */
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)).padStart(
    CODE_LENGTH,
    "0"
  );
}

function normalizeCode(code) {
  return String(code ?? "").replace(/\D/g, "").slice(0, CODE_LENGTH);
}

/**
 * ينشئ طالبًا جديدًا بكود فريد.
 * يتحقق من عدم استخدام الكود قبل الإضافة، وعند أي تعارض (23505)
 * يولد كودًا جديدًا تلقائيًا حتى MAX_CODE_RETRIES محاولات.
 */
export async function createStudent({ fullName, stage, grade }) {
  let lastError = null;

  for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
    const code = generateCode();

    // تحقق مسبق أن الكود غير مستخدم
    const { data: existing, error: checkError } = await supabase
      .from("students")
      .select("id")
      .eq("student_code", code)
      .maybeSingle();
    if (checkError) throw checkError;
    if (existing) continue;

    const { data, error } = await supabase
      .from("students")
      .insert({
        student_code: code,
        full_name: fullName.trim(),
        stage,
        grade,
        is_active: true,
      })
      .select()
      .single();

    if (!error) return data;

    // تعارض في الكود (سبقناها بسرعة) → كود جديد
    if (error.code === "23505") {
      lastError = error;
      continue;
    }
    throw error;
  }

  throw lastError || new Error("تعذر توليد كود فريد للطالب");
}

export async function fetchStudents() {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchStudentByCode(code) {
  const normalized = normalizeCode(code);
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("student_code", normalized)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteStudent(id) {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw error;
}

/**
 * نتائج الطالب: المحاولات المرتبطة به مباشرة عبر student_id،
 * بالإضافة إلى النتائج القديمة المطابقة بالاسم والمرحلة والصف
 * (الطلاب القدامى ليس لديهم student_id في محاولاتهم).
 * قراءة فقط — لا تعدل أي نتيجة محفوظة.
 */
export async function fetchStudentAttempts(student) {
  const conditions = [];

  if (student?.id) {
    conditions.push(`student_id.eq.${student.id}`);
  }

  const escapedName = String(student?.full_name ?? "").replace(/"/g, '""');
  if (escapedName) {
    conditions.push(
      `and(student_name.eq."${escapedName}",stage.eq."${student.stage}",grade.eq."${student.grade}")`
    );
  }

  if (conditions.length === 0) return [];

  const { data, error } = await supabase
    .from("attempts")
    .select("*, exams(title)")
    .or(conditions.join(","))
    .in("status", ["submitted", "auto_submitted"])
    .order("submitted_at", { ascending: false });

  if (error) throw error;

  // إزالة التكرار إن تطابق نفس المحاولة بالشرطين
  const seen = new Set();
  return (data || []).filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}
