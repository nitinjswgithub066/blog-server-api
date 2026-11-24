import { prisma } from "../../config/prisma";

export const getPublicProfileService = async () => {
  const admin = await prisma.adminUser.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    include: { profile: { include: { socials: true } } },
  });
  if (!admin) return null;
  return {
    id: admin.id,
    fullName: admin.name,
    username: admin.username || "",
    role: admin.role.toLowerCase(),
    bio: admin.bio || "",
    avatar: admin.avatarUrl || "",
    location: admin.profile?.location || "",
    website: admin.profile?.website || "",
    socialLinks: {
      twitter: admin.profile?.socials?.twitter || null,
      linkedin: admin.profile?.socials?.linkedin || null,
      github: admin.profile?.socials?.github || null,
      instagram: admin.profile?.socials?.instagram || null,
      youtube: admin.profile?.socials?.youtube || null,
      portfolio: admin.profile?.socials?.portfolio || null,
    },
    updatedAt: (admin.profile?.updatedAt || admin.updatedAt).toISOString(),
  };
};
