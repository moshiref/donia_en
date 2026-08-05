export const STAGES = {
  primary: {
    key: "primary",
    icon: "📚",
    title: "اختبار المرحلة الابتدائية",
    stageTitle: "المرحلة الابتدائية",
    accent: "primary",
    grades: [
      { key: "grade-3", label: "الصف الثالث الابتدائي" },
      { key: "grade-4", label: "الصف الرابع الابتدائي" },
      { key: "grade-5", label: "الصف الخامس الابتدائي" },
      { key: "grade-6", label: "الصف السادس الابتدائي" },
    ],
  },
  preparatory: {
    key: "preparatory",
    icon: "🎒",
    title: "اختبار المرحلة الإعدادية",
    stageTitle: "المرحلة الإعدادية",
    accent: "purple",
    grades: [
      { key: "grade-1", label: "الصف الأول الإعدادي" },
      { key: "grade-2", label: "الصف الثاني الإعدادي" },
      { key: "grade-3", label: "الصف الثالث الإعدادي" },
    ],
  },
};

export function getStageConfig(stageKey) {
  return STAGES[stageKey] ?? null;
}
