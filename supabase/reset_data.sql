-- ============================================================
-- RESET بيانات المنصة — مسح البيانات فقط دون لمس البنية
-- نفّذ هذا الملف في: Supabase Dashboard → SQL Editor
--
-- ❌ لا يحتوي DROP TABLE ولا ALTER ولا حذف جداول أو RLS أو دوال
-- ✅ يحذف البيانات فقط بالترتيب الصحيح حسب الـ Foreign Keys:
--    answers → attempts → choices → questions → exams → students
-- ✅ حسابات الأدمن في auth.users غير متأثرة إطلاقًا
--
-- ⚠️ لا رجعة فيه بعد COMMIT — تأكدي قبل التنفيذ
-- ============================================================

begin;

-- 1) الإجابات التفصيلية (تشير لـ attempts و questions)
delete from public.answers;

-- 2) محاولات الطلاب (النتائج والدرجات)
delete from public.attempts;

-- 3) الاختيارات (تشير لـ questions)
delete from public.choices;

-- 4) الأسئلة (تشير لـ exams)
delete from public.questions;

-- 5) الامتحانات
delete from public.exams;

-- 6) الطلاب
delete from public.students;

commit;

-- ============================================================
-- تحقق بعد التنفيذ — كل النتائج يجب أن تكون صفرًا
-- ============================================================
select 'students' as t, count(*) from public.students
union all select 'exams',      count(*) from public.exams
union all select 'questions',  count(*) from public.questions
union all select 'choices',    count(*) from public.choices
union all select 'attempts',   count(*) from public.attempts
union all select 'answers',    count(*) from public.answers;

-- تحقق أن البنية سليمة (يجب أن يرجع صفوفًا)
select proname from pg_proc where proname in ('start_attempt', 'submit_attempt');
