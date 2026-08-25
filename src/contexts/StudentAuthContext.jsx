import { createContext, useContext, useEffect, useState } from "react";
import { fetchStudentByCode } from "../lib/studentService";

const STORAGE_KEY = "student_session";

const StudentAuthContext = createContext(null);

export function StudentAuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.student_code) setStudent(parsed);
      }
    } catch {
      // ignore corrupted session
    }
    setLoading(false);
  }, []);

  const loginByCode = async (code) => {
    const data = await fetchStudentByCode(code);
    if (!data) {
      throw new Error("الكود غير صحيح أو غير موجود.");
    }
    if (data.is_active === false) {
      throw new Error("هذا الحساب غير مفعل، يرجى التواصل مع المدرسة.");
    }
    const sessionStudent = {
      id: data.id,
      student_code: data.student_code,
      full_name: data.full_name,
      stage: data.stage,
      grade: data.grade,
    };
    setStudent(sessionStudent);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionStudent));
    return sessionStudent;
  };

  const signOutStudent = () => {
    setStudent(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <StudentAuthContext.Provider
      value={{ student, loading, isStudentLoggedIn: !!student, loginByCode, signOutStudent }}
    >
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  const ctx = useContext(StudentAuthContext);
  if (!ctx) throw new Error("useStudentAuth must be used within StudentAuthProvider");
  return ctx;
}
