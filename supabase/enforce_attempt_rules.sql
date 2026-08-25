-- ============================================================
-- قواعد المحاولات الإجبارية — نفّذ هذا الملف في:
-- Supabase Dashboard → SQL Editor
--
-- مهم جدًا: هذا الملف لا يعدل أي بيانات أو درجات محفوظة.
-- المحاولات القديمة (student_id = NULL) لا تمسها القيود إطلاقًا.
--
-- يضيف:
-- 1) Unique Index جزئي: student_id + exam_id = attempt واحدة فقط
-- 2) start_attempt(): بدء/استئناف المحاولة مع التحقق الخلفي من
--    الصلاحية (stage/grade من بيانات الطالب المخزنة) ومنع التكرار
-- 3) submit_attempt(): تسليم آمن من الخادم — idempotent، يرفض
--    التسليم بعد انتهاء الوقت (إلا auto)، ويصحح الإجابات في SQL
-- ============================================================

-- ------------------------------------------------------------
-- 1) قاعدة المحاولة الواحدة على مستوى قاعدة البيانات
-- جزئي: يسري فقط على المحاولات المرتبطة بطلاب (student_id غير فارغ)
-- فتبقى كل المحاولات القديمة كما هي دون أي تعارض
-- ------------------------------------------------------------
create unique index if not exists attempts_one_per_student_exam
  on public.attempts (student_id, exam_id)
  where student_id is not null;

-- ------------------------------------------------------------
-- 2) بدء محاولة: RPC واحد لكل عمليات البدء/الاستئناف
-- يرجع صف المحاولة. الأخطاء تُرمى كرسائل نصية:
--   exam_not_found / exam_not_available / student_not_found /
--   student_inactive / not_allowed / already_attempted / start_conflict
-- ------------------------------------------------------------
create or replace function public.start_attempt(
  p_exam_id uuid,
  p_student_id uuid,
  p_client_token text
)
returns public.attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exam    public.exams%rowtype;
  v_student public.students%rowtype;
  v_attempt public.attempts%rowtype;
begin
  if p_student_id is null then
    raise exception 'student_not_found';
  end if;

  select * into v_exam from public.exams where id = p_exam_id;
  if not found then
    raise exception 'exam_not_found';
  end if;
  if v_exam.status <> 'published' then
    raise exception 'exam_not_available';
  end if;

  select * into v_student from public.students where id = p_student_id;
  if not found then
    raise exception 'student_not_found';
  end if;
  if v_student.is_active is not distinct from false then
    raise exception 'student_inactive';
  end if;

  -- صلاحية المرحلة والصف: من بيانات الطالب المخزنة في DB وليس من الواجهة
  if v_student.stage is distinct from v_exam.stage
     or v_student.grade is distinct from v_exam.grade then
    raise exception 'not_allowed';
  end if;

  -- هل له محاولة سابقة على نفس الامتحان؟
  select * into v_attempt
  from public.attempts
  where student_id = p_student_id and exam_id = p_exam_id
  order by created_at desc
  limit 1;

  if found then
    if v_attempt.status in ('submitted', 'auto_submitted') then
      raise exception 'already_attempted';
    end if;
    -- in_progress → نفس المحاولة تُستأنف (الوقت من started_at الحقيقي)
    return v_attempt;
  end if;

  begin
    insert into public.attempts (
      exam_id, student_id, student_name, stage, grade,
      status, started_at, client_token
    ) values (
      p_exam_id, p_student_id, v_student.full_name,
      v_exam.stage, v_exam.grade,
      'in_progress', now(), coalesce(p_client_token, gen_random_uuid()::text)
    )
    returning * into v_attempt;
    return v_attempt;
  exception
    when unique_violation then
      -- سباق متزامن: محاولة أخرى أنشئت للتو لنفس student+exam
      select * into v_attempt
      from public.attempts
      where student_id = p_student_id and exam_id = p_exam_id
      order by created_at desc
      limit 1;
      if found and v_attempt.status in ('submitted', 'auto_submitted') then
        raise exception 'already_attempted';
      end if;
      if found then
        return v_attempt;
      end if;
      raise exception 'start_conflict';
  end;
end;
$$;

-- ------------------------------------------------------------
-- 3) تسليم المحاولة: idempotent + فرض الوقت من الخادم + تصحيح SQL
-- p_answers شكلها: { "<question_id>": ["<choice_id>", ...], ... }
-- نفس منطق التصحيح الموجود في examService.js تمامًا:
--   بدون اختيار = unanswered | multi_select: تطابق كامل | غيره: اختيار واحد صحيح
-- الأخطاء: attempt_not_found / already_submitted / expired
-- ------------------------------------------------------------
create or replace function public.submit_attempt(
  p_attempt_id uuid,
  p_answers jsonb,
  p_is_auto boolean default false
)
returns public.attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.attempts%rowtype;
  v_exam    public.exams%rowtype;
  v_q       record;
  v_correct uuid[];
  v_selected uuid[];
  v_is_correct boolean;
  v_earned numeric := 0;
  v_total numeric := 0;
  v_correct_count int := 0;
  v_wrong_count int := 0;
  v_unanswered int := 0;
begin
  select * into v_attempt from public.attempts where id = p_attempt_id;
  if not found then
    raise exception 'attempt_not_found';
  end if;

  -- منع Submit المكرر: المحاولة المنتهية لا تُسلَّم مرة أخرى
  if v_attempt.status <> 'in_progress' then
    raise exception 'already_submitted';
  end if;

  select * into v_exam from public.exams where id = v_attempt.exam_id;
  if not found then
    raise exception 'exam_not_found';
  end if;

  -- فرض انتهاء الوقت من الخادم بناءً على started_at الحقيقي
  if now() >= v_attempt.started_at + make_interval(mins => v_exam.duration_minutes) then
    if p_is_auto is not true then
      raise exception 'expired';
    end if;
  end if;

  for v_q in
    select q.id,
           q.score,
           q.question_type,
           coalesce(array_agg(c.id) filter (where c.is_correct), '{}') as correct_ids
    from public.questions q
    left join public.choices c on c.question_id = q.id
    where q.exam_id = v_attempt.exam_id
    group by q.id, q.score, q.question_type, q.sort_order
    order by q.sort_order
  loop
    v_total := v_total + v_q.score;

    if p_answers is not null
       and p_answers ? v_q.id
       and jsonb_typeof(p_answers -> v_q.id) = 'array' then
      select coalesce(array_agg(e.value::uuid), '{}')
      into v_selected
      from jsonb_array_elements_text(p_answers -> v_q.id) e
      where e.value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    else
      v_selected := '{}'::uuid[];
    end if;

    -- بدون إجابة فعلية: تبقى خارج جدول answers (نفس تصميم النظام الحالي)
    if cardinality(v_selected) = 0 then
      v_unanswered := v_unanswered + 1;
      continue;
    end if;

    if v_q.question_type in ('multi_select', 'multiple') then
      v_is_correct :=
        cardinality(v_selected) = cardinality(v_correct_ids)
        and v_selected <@ v_correct_ids;
    else
      v_is_correct :=
        cardinality(v_selected) = 1
        and v_selected[1] = any (v_correct_ids);
    end if;

    if v_is_correct then
      v_earned := v_earned + v_q.score;
      v_correct_count := v_correct_count + 1;
    else
      v_wrong_count := v_wrong_count + 1;
    end if;

    insert into public.answers (
      attempt_id, question_id, selected_choice_ids, is_correct, score_earned
    ) values (
      p_attempt_id, v_q.id, v_selected, v_is_correct,
      case when v_is_correct then v_q.score else 0 end
    )
    on conflict (attempt_id, question_id) do update
      set selected_choice_ids = excluded.selected_choice_ids,
          is_correct = excluded.is_correct,
          score_earned = excluded.score_earned,
          answered_at = now();
  end loop;

  -- التحديث الشرطي يمنع سباق Submit مزدوج (يدوي + تلقائي في نفس اللحظة)
  update public.attempts set
    status = case when p_is_auto then 'auto_submitted' else 'submitted' end,
    submitted_at = now(),
    score = v_earned,
    total_score = v_total,
    percentage = case when v_total > 0 then round(v_earned / v_total * 100) else 0 end
  where id = p_attempt_id and status = 'in_progress'
  returning * into v_attempt;

  if not found then
    raise exception 'already_submitted';
  end if;

  return v_attempt;
end;
$$;

-- ------------------------------------------------------------
-- 4) الصلاحيات: الطالب (anon) ينفذ الدالتين فقط
-- ------------------------------------------------------------
grant execute on function public.start_attempt(uuid, uuid, text) to anon, authenticated;
grant execute on function public.submit_attempt(uuid, jsonb, boolean) to anon, authenticated;

-- ------------------------------------------------------------
-- تحقق بعد التنفيذ:
-- select proname from pg_proc where proname in ('start_attempt','submit_attempt');
-- select indexname from pg_indexes where indexname = 'attempts_one_per_student_exam';
-- ------------------------------------------------------------
