export const APP_NAME = "JWTelecoms";
export const APP_DESCRIPTION = "Nigeria's trusted VTU platform";

export const ROLES = {
  USER: "user",
  AGENT: "agent",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
} as const;

export const TRANSACTION_TYPES = {
  FUNDING: "funding",
  AIRTIME: "airtime",
  DATA: "data",
  ELECTRICITY: "electricity",
  CABLE: "cable",
  EXAM_PIN: "exam_pin",
  TRANSFER: "transfer",
  REVERSAL: "reversal",
} as const;

export const TRANSACTION_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SUCCESS: "success",
  FAILED: "failed",
  REVERSED: "reversed",
} as const;

export const NETWORKS = [
  { id: "mtn", name: "MTN", color: "#FFCC00" },
  { id: "airtel", name: "Airtel", color: "#FF0000" },
  { id: "glo", name: "Glo", color: "#00A651" },
  { id: "9mobile", name: "9mobile", color: "#006848" },
] as const;

export const DISCOS = [
  { id: "ikeja-electric", name: "Ikeja Electric (IKEDC)" },
  { id: "eko-electric", name: "Eko Electric (EKEDC)" },
  { id: "abuja-electric", name: "Abuja Electric (AEDC)" },
  { id: "kano-electric", name: "Kano Electric (KEDCO)" },
  { id: "portharcourt-electric", name: "Port Harcourt Electric (PHED)" },
  { id: "ibadan-electric", name: "Ibadan Electric (IBEDC)" },
  { id: "kaduna-electric", name: "Kaduna Electric (KAEDCO)" },
  { id: "jos-electric", name: "Jos Electric (JED)" },
  { id: "enugu-electric", name: "Enugu Electric (EEDC)" },
  { id: "benin-electric", name: "Benin Electric (BEDC)" },
  { id: "yola-electric", name: "Yola Electric (YEDC)" },
  { id: "aba-electric", name: "Aba Electric (ABA)" },
] as const;

export const CABLE_PROVIDERS = [
  { id: "dstv", name: "DStv" },
  { id: "gotv", name: "GOtv" },
  { id: "startimes", name: "StarTimes" },
] as const;

export const EXAM_TYPES = [
  { id: "waec", name: "WAEC" },
  { id: "neco", name: "NECO" },
  { id: "nabteb", name: "NABTEB" },
] as const;

export const MIN_FUNDING_AMOUNT = 100; // ₦100 in Naira
export const MAX_FUNDING_AMOUNT = 1000000; // ₦1,000,000 in Naira
