import { customAlphabet } from "nanoid";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const suffix = customAlphabet(ALPHA, 4);

export const generateRef = (now = new Date()): string => {
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `BAC-${yy}${mm}${dd}-${suffix()}`;
};
