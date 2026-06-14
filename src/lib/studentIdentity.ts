import { useEffect, useState } from "react";

export type StudentIdentity = {
  name: string;
  email: string;
  registrationNumber: string;
  faculty?: string;
};

const KEY = "iuea_student_identity";

export function getStudentIdentity(): StudentIdentity | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as StudentIdentity; } catch { return null; }
}

export function setStudentIdentity(id: StudentIdentity) {
  localStorage.setItem(KEY, JSON.stringify(id));
  window.dispatchEvent(new Event("student-identity-changed"));
}

export function clearStudentIdentity() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("student-identity-changed"));
}

export function useStudentIdentity() {
  const [identity, setIdentity] = useState<StudentIdentity | null>(() => getStudentIdentity());
  useEffect(() => {
    const handler = () => setIdentity(getStudentIdentity());
    window.addEventListener("student-identity-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("student-identity-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return identity;
}
