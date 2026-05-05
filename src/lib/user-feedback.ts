export const USER_FEEDBACK_KIND_OPTIONS = [
  { value: "general", label: "General Feedback" },
  { value: "feature_idea", label: "Feature Idea" },
  { value: "bug", label: "Bug" },
  { value: "enhancement", label: "Enhancement" },
  { value: "other", label: "Other" },
] as const;

export type UserFeedbackKind = (typeof USER_FEEDBACK_KIND_OPTIONS)[number]["value"];

export function labelForUserFeedbackKind(kind: UserFeedbackKind): string {
  const row = USER_FEEDBACK_KIND_OPTIONS.find((o) => o.value === kind);
  return row?.label ?? kind;
}
