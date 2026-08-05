-- ============================================================
-- إصلاح صلاحيات قاعدة البيانات — نفّذ هذا الملف في Supabase SQL Editor
-- هذا الملف يصلح مشكلة 401 permission denied للطلاب (anon)
-- ============================================================

-- 1) منح الصلاحيات لدور anon (الطالب غير المسجل)
grant select on public.exams to anon;
grant select on public.questions to anon;
grant select on public.choices to anon;
grant insert on public.attempts to anon;
grant select on public.attempts to anon;
grant update on public.attempts to anon;
grant insert on public.answers to anon;
grant select on public.answers to anon;
grant update on public.answers to anon;

-- 2) منح الصلاحيات لدور authenticated (الأدمن)
grant all on public.exams to authenticated;
grant all on public.questions to authenticated;
grant all on public.choices to authenticated;
grant all on public.attempts to authenticated;
grant all on public.answers to authenticated;

-- 3) تحديث RLS Policies لتتوافق مع صلاحيات anon
-- (إذا كانت الـ policies موجودة مسبقاً، احذفها أولاً ثم أعد إنشاءها)

-- Exams
drop policy if exists "exams_select_published" on public.exams;
create policy "exams_select_published" on public.exams
  for select using (status = 'published' or auth.role() = 'authenticated');

-- Questions
drop policy if exists "questions_select" on public.questions;
create policy "questions_select" on public.questions
  for select using (
    exists (
      select 1 from public.exams e
      where e.id = questions.exam_id
        and (e.status = 'published' or auth.role() = 'authenticated')
    )
  );

-- Choices
drop policy if exists "choices_select" on public.choices;
create policy "choices_select" on public.choices
  for select using (
    exists (
      select 1 from public.questions q
      join public.exams e on e.id = q.exam_id
      where q.id = choices.question_id
        and (e.status = 'published' or auth.role() = 'authenticated')
    )
  );

-- Attempts: السماح للطلاب بقراءة وتحديث محاولاتهم أثناء الامتحان
drop policy if exists "attempts_select_own" on public.attempts;
drop policy if exists "attempts_update_own" on public.attempts;
drop policy if exists "attempts_select_anon" on public.attempts;
drop policy if exists "attempts_update_anon" on public.attempts;

create policy "attempts_select_anon" on public.attempts
  for select using (true);

create policy "attempts_update_anon" on public.attempts
  for update using (true);

-- Answers: السماح للطلاب بقراءة إجاباتهم أثناء الامتحان
drop policy if exists "answers_select" on public.answers;
drop policy if exists "answers_select_anon" on public.answers;

create policy "answers_select_anon" on public.answers
  for select using (true);
