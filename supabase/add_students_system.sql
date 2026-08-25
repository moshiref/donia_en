-- ============================================================
-- نظام الطلاب وأكواد الدخول — نفّذ هذا الملف في:
-- Supabase Dashboard → SQL Editor
--
-- مهم جدًا: هذا الملف لا يعدّل أو يحذف أي بيانات موجودة
-- (لا يلمس درجات الامتحانات attempts/score/percentage إطلاقًا).
-- 1) ينشئ جدول students جديد.
-- 2) يضيف عمودًا اختياريًا student_id لجدول attempts (NULL للنتائج القديمة
--    وتبقى كما هي دون أي تغيير).
-- ============================================================

-- 1) جدول الطلاب — الإنشاء فقط من لوحة التحكم (المدرسة/المعلم)
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_code text not null unique check (student_code ~ '^[0-9]{6}$'),
  full_name text not null,
  stage text not null,
  grade text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists students_code_idx on public.students(student_code);

-- 2) ربط المحاولات بالطالب (عمود اختياري — النتائج القديمة تبقى NULL كما هي)
alter table public.attempts
  add column if not exists student_id uuid references public.students(id) on delete set null;

create index if not exists attempts_student_id_idx on public.attempts(student_id);

-- 3) الصلاحيات
-- anon (الطالب): قراءة فقط لتسجيل الدخول بالكود — لا يمكنه إنشاء طلاب
grant select on public.students to anon;
grant insert on public.attempts to anon;
grant update on public.attempts to anon;
grant select on public.attempts to anon;

-- authenticated (الأدمن): صلاحيات كاملة على الطلاب
grant all on public.students to authenticated;

-- 4) RLS
alter table public.students enable row level security;

drop policy if exists "students_select" on public.students;
create policy "students_select"
  on public.students for select
  using (true);

drop policy if exists "students_admin_all" on public.students;
create policy "students_admin_all"
  on public.students for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- الطالب (anon) يستطيع كتابة student_id على محاولته أثناء الاختبار
-- (نفس سياسات attempts الموجودة مسبقًا تبقى كما هي)

-- ============================================================
-- 5) تحقق بعد التنفيذ — يجب أن يرجع صفًا واحدًا بدون أخطاء
-- ============================================================
-- select * from public.students limit 1;
-- select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'attempts'
--     and column_name = 'student_id';

