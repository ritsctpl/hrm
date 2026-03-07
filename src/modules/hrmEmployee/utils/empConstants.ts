export const EMPLOYEE_STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

export const BLOOD_GROUP_OPTIONS = [
  { label: "A+", value: "A+" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B-", value: "B-" },
  { label: "O+", value: "O+" },
  { label: "O-", value: "O-" },
  { label: "AB+", value: "AB+" },
  { label: "AB-", value: "AB-" },
];

export const GENDER_OPTIONS = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
  { label: "Prefer not to say", value: "NOT_SPECIFIED" },
];

export const MARITAL_STATUS_OPTIONS = [
  { label: "Single", value: "SINGLE" },
  { label: "Married", value: "MARRIED" },
  { label: "Divorced", value: "DIVORCED" },
  { label: "Widowed", value: "WIDOWED" },
];

export const TITLE_OPTIONS = [
  { label: "Mr.", value: "Mr." },
  { label: "Ms.", value: "Ms." },
  { label: "Mrs.", value: "Mrs." },
  { label: "Dr.", value: "Dr." },
  { label: "Prof.", value: "Prof." },
];

export const SKILL_PROFICIENCY_OPTIONS = [
  { label: "Beginner", value: "BEGINNER" },
  { label: "Intermediate", value: "INTERMEDIATE" },
  { label: "Expert", value: "EXPERT" },
];

export const SKILL_PROFICIENCY_COLORS: Record<string, string> = {
  BEGINNER: "blue",
  INTERMEDIATE: "orange",
  EXPERT: "green",
};

export const DOCUMENT_TYPE_OPTIONS = [
  { label: "Offer Letter", value: "OFFER_LETTER" },
  { label: "PAN Card", value: "PAN_CARD" },
  { label: "Aadhar Card", value: "AADHAR_CARD" },
  { label: "Passport", value: "PASSPORT" },
  { label: "Visa", value: "VISA" },
  { label: "Degree Certificate", value: "DEGREE_CERTIFICATE" },
  { label: "Experience Letter", value: "EXPERIENCE_LETTER" },
  { label: "Other", value: "OTHER" },
];

export const GOVT_ID_TYPE_OPTIONS = [
  { label: "PAN", value: "PAN" },
  { label: "Aadhar", value: "AADHAR" },
  { label: "Passport", value: "PASSPORT" },
  { label: "Driving License", value: "DRIVING_LICENSE" },
  { label: "Voter ID", value: "VOTER_ID" },
];

export const ASSET_CONDITION_OPTIONS = [
  { label: "Good", value: "GOOD" },
  { label: "Damaged", value: "DAMAGED" },
  { label: "Lost", value: "LOST" },
];

export const ASSET_CONDITION_COLORS: Record<string, string> = {
  GOOD: "green",
  DAMAGED: "orange",
  LOST: "red",
};

export const VIEW_MODES = {
  TABLE: "table",
  CARD: "card",
} as const;

export const PROFILE_TABS = {
  BASIC: "basic",
  OFFICIAL: "official",
  PERSONAL: "personal",
  CONTACT: "contact",
  SKILLS: "skills",
  JOB_HISTORY: "jobHistory",
  EXPERIENCE: "experience",
  EDUCATION: "education",
  TRAINING: "training",
  DOCUMENTS: "documents",
  ASSETS: "assets",
} as const;

export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const ONBOARDING_STEPS = [
  { title: "Basic Info", key: "basic" },
  { title: "Official Details", key: "official" },
  { title: "Contact Info", key: "contact" },
  { title: "Review", key: "review" },
];
