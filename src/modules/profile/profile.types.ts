import { Role } from "@prisma/client";

export interface UpdateProfileInput {
  fullName: string;
  username: string;
  email: string;
  role: Role;
  bio: string | null;
  location: string | null;
  website: string | null;
}

export interface SocialProfileInput {
  twitter: string | null;
  linkedin: string | null;
  github: string | null;
  instagram: string | null;
  youtube: string | null;
  portfolio: string | null;
}

export interface ProfileStats {
  articles: number;
  views: number;
  topics: number;
}
