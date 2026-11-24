import { Role } from "@prisma/client";
import { SocialProfileInput, UpdateProfileInput } from "./profile.types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

const normalizeOptional = (value: unknown) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
};

const validateOptionalUrl = (value: unknown, label: string) => {
  const normalized = normalizeOptional(value);
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${label} must be a valid HTTP or HTTPS URL.`);
  }
};

export const validateProfileUpdate = (body: Record<string, unknown>): UpdateProfileInput => {
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = typeof body.role === "string" ? body.role.toUpperCase() : "";
  const bio = normalizeOptional(body.bio);
  const location = normalizeOptional(body.location);

  if (!fullName) throw new Error("Full name is required.");
  if (fullName.length > 100) throw new Error("Full name cannot exceed 100 characters.");
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error("Username must be 3-30 lowercase letters, numbers, or underscores.");
  }
  if (!EMAIL_PATTERN.test(email)) throw new Error("A valid email address is required.");
  if (!Object.values(Role).includes(role as Role)) throw new Error("Invalid role.");
  if (bio && bio.length > 250) throw new Error("Bio cannot exceed 250 characters.");
  if (location && location.length > 120) throw new Error("Location cannot exceed 120 characters.");

  return {
    fullName,
    username,
    email,
    role: role as Role,
    bio,
    location,
    website: validateOptionalUrl(body.website, "Website"),
  };
};

export const validateSocialUpdate = (body: Record<string, unknown>): SocialProfileInput => ({
  twitter: validateOptionalUrl(body.twitter, "Twitter / X"),
  linkedin: validateOptionalUrl(body.linkedin, "LinkedIn"),
  github: validateOptionalUrl(body.github, "GitHub"),
  instagram: validateOptionalUrl(body.instagram, "Instagram"),
  youtube: validateOptionalUrl(body.youtube, "YouTube"),
  portfolio: validateOptionalUrl(body.portfolio, "Portfolio"),
});
