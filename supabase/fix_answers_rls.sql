-- ============================================================
-- إصلاح حفظ إجابات الطلاب (answers) — نفّذ هذا الملف في:
-- Supabase Dashboard → SQL Editor
--
-- المشكلة: جدول answers محجوب عن دور anon (الطالب) بسبب RLS،
-- لذلك كل محاولات حفظ الإجابات أثناء الامتحان تفشل بصمت،
-- ويبقى جدول answers فارغًا فتظهر إحصائيات "تفاصيل النتيجة" صفرية.
--
-- مهم: هذا الملف لا يعدّل أي درجات أو نتائج محفوظة (score /
-- total_score / percentage) — فقط يضيف الصلاحيات والسياسات.
-- ============================================================

-- 1) منح الصلاحيات لدور anon (الطالب غير المسجل)
grant insert on public.answers to anon;
grant select on public.answers to anon;
grant update on public.answers to anon;

-- 2) RLS Policies لجدول answers
drop policy if exists "answers_insert" on public.answers;
create policy "answers_insert"
  on public.answers for insert
  with check (true);

drop policy if exists "answers_upsert" on public.answers;
create policy "answers_upsert"
  on public.answers for update
  using (true)
  with check (true);

drop policy if exists "answers_select_anon" on public.answers;
create policy "answers_select_anon"
  on public.answers for select
  using (true);
