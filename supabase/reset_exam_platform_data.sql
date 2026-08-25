-- ============================================================
-- RPC محو بيانات المنصة — نفّذ هذا الملف في:
-- Supabase Dashboard → SQL Editor
--
-- ❌ لا يحذف أي جدول أو schema أو RLS أو دوال أخرى
-- ❌ لا يلمس auth.users (حساب الأدمن) إطلاقًا
-- ✅ يحذف البيانات فقط، بالترتيب الصحيح حسب الـ Foreign Keys:
--    answers → attempts → choices → questions → exams → students
-- ✅ Atomic: كامل الدالة تعمل داخل transaction واحد
-- ✅ متاحة للأدمن المصادق فقط (authenticated) — الطلاب/anon ممنوعون
-- ============================================================

create or replace function public.reset_exam_platform_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_counts jsonb;
begin
  -- حماية: الأدمن المصادق فقط — أي مستخدم آخر (anon/طالب) يُرفض
  if auth.uid() is null or auth.role() <> 'authenticated' then
    raise exception 'unauthorized';
  end if;

  -- الترتيب حسب الـ Foreign Keys الموجودة فعليًا:
  -- answers(attempt_id, question_id) → attempts(exam_id, student_id)
  -- → choices(question_id) → questions(exam_id) → exams → students
  delete from public.answers;
  delete from public.attempts;
  delete from public.choices;
  delete from public.questions;
  delete from public.exams;
  delete from public.students;

  -- تحقق بعد المحو: يجب أن تكون كل القيم صفرًا
  select jsonb_build_object(
    'students',  (select count(*) from public.students),
    'exams',     (select count(*) from public.exams),
    'questions', (select count(*) from public.questions),
    'choices',   (select count(*) from public.choices),
    'attempts',  (select count(*) from public.attempts),
    'answers',   (select count(*) from public.answers)
  ) into v_counts;

  if (v_counts ->> 'students')::bigint > 0
     or (v_counts ->> 'exams')::bigint > 0
     or (v_counts ->> 'questions')::bigint > 0
     or (v_counts ->> 'attempts')::bigint > 0 then
    raise exception 'reset_failed';
  end if;

  return v_counts;
end;
$$;

-- الصلاحيات: authenticated فقط — سحب التنفيذ من الجميع ثم منح الأدمن
revoke execute on function public.reset_exam_platform_data() from public;
revoke execute on function public.reset_exam_platform_data() from anon;
grant execute on function public.reset_exam_platform_data() to authenticated;

-- تحقق بعد التنفيذ:
-- select proname, proacl from pg_proc where proname = 'reset_exam_platform_data';
