-- ============================================================
-- منصة مس دنيا للاختبارات والتفوق — Database Schema
-- نفّذ هذا الملف في: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1) جدول الاختبارات
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  stage text not null check (stage in ('primary', 'preparatory')),
  grade text not null,
  duration_minutes integer not null default 20 check (duration_minutes > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'stopped')),
  total_score numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) جدول الأسئلة
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('mcq', 'true_false', 'image', 'multi_select')),
  image_url text,
  score numeric not null default 1 check (score > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists questions_exam_id_idx on public.questions(exam_id);

-- 3) جدول الاختيارات
create table if not exists public.choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  choice_text text not null,
  is_correct boolean not null default false,
  sort_order integer not null default 0
);

create index if not exists choices_question_id_idx on public.choices(question_id);

-- 4) جدول محاولات الطلاب
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_name text not null,
  stage text not null,
  grade text not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'auto_submitted')),
  score numeric not null default 0,
  total_score numeric not null default 0,
  percentage numeric not null default 0,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  -- منع التكرار: fingerprint فريد لكل محاولة
  client_token text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists attempts_exam_id_idx on public.attempts(exam_id);
create index if not exists attempts_status_idx on public.attempts(status);

-- 5) جدول إجابات الطلاب
create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_choice_ids uuid[] not null default '{}',
  is_correct boolean,
  score_earned numeric not null default 0,
  answered_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists answers_attempt_id_idx on public.answers(attempt_id);

-- ============================================================
-- منح الصلاحيات (GRANT) — يجب أن تسبق RLS Policies
-- بدون هذه الصلاحيات، يحصل anon على 401 permission denied
-- ============================================================

-- anon (الطالب غير المسجل): قراءة الامتحانات المنشورة + إنشاء المحاولات والإجابات
grant select on public.exams to anon;
grant select on public.questions to anon;
grant select on public.choices to anon;
grant insert on public.attempts to anon;
grant select on public.attempts to anon;
grant update on public.attempts to anon;
grant insert on public.answers to anon;
grant select on public.answers to anon;
grant update on public.answers to anon;

-- authenticated (الأدمن): صلاحيات كاملة على كل الجداول
grant all on public.exams to authenticated;
grant all on public.questions to authenticated;
grant all on public.choices to authenticated;
grant all on public.attempts to authenticated;
grant all on public.answers to authenticated;

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.exams enable row level security;
alter table public.questions enable row level security;
alter table public.choices enable row level security;
alter table public.attempts enable row level security;
alter table public.answers enable row level security;

-- Exams: الطلاب يرون المنشور فقط، الأدمن يرى كل شيء
create policy "exams_select_published" on public.exams
  for select using (status = 'published' or auth.role() = 'authenticated');

create policy "exams_admin_all" on public.exams
  for all using (auth.role() = 'authenticated');

-- Questions: الطلاب يرون أسئلة الاختبارات المنشورة فقط
create policy "questions_select" on public.questions
  for select using (
    exists (
      select 1 from public.exams e
      where e.id = questions.exam_id
        and (e.status = 'published' or auth.role() = 'authenticated')
    )
  );

create policy "questions_admin_all" on public.questions
  for all using (auth.role() = 'authenticated');

-- Choices: نفس منطق الأسئلة
create policy "choices_select" on public.choices
  for select using (
    exists (
      select 1 from public.questions q
      join public.exams e on e.id = q.exam_id
      where q.id = choices.question_id
        and (e.status = 'published' or auth.role() = 'authenticated')
    )
  );

create policy "choices_admin_all" on public.choices
  for all using (auth.role() = 'authenticated');

-- Attempts: الطلاب ينشئون محاولاتهم ويرون/يحدثون محاولاتهم أثناء الامتحان
create policy "attempts_insert" on public.attempts
  for insert with check (true);

create policy "attempts_select_anon" on public.attempts
  for select using (true);

create policy "attempts_update_anon" on public.attempts
  for update using (true);

create policy "attempts_admin_all" on public.attempts
  for all using (auth.role() = 'authenticated');

-- Answers: الطلاب يحفظون إجاباتهم ويرونها أثناء الامتحان
create policy "answers_insert" on public.answers
  for insert with check (true);

create policy "answers_upsert" on public.answers
  for update using (true);

create policy "answers_select_anon" on public.answers
  for select using (true);

create policy "answers_admin_all" on public.answers
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- دالة تحديث updated_at تلقائيًا
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists exams_updated_at on public.exams;
create trigger exams_updated_at
  before update on public.exams
  for each row execute function public.handle_updated_at();

-- ============================================================
-- دالة تحديث total_score للاختبار عند تغيير الأسئلة
-- ============================================================
create or replace function public.refresh_exam_total_score(p_exam_id uuid)
returns void as $$
begin
  update public.exams
  set total_score = coalesce((
    select sum(score) from public.questions where exam_id = p_exam_id
  ), 0)
  where id = p_exam_id;
end;
$$ language plpgsql security definer;
