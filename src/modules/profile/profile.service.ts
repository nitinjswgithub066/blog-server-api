import { MediaUsage, PostStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { destroyCloudinaryAsset, uploadBufferToCloudinary } from "../../services/cloudinary.service";
import { SocialProfileInput, UpdateProfileInput } from "./profile.types";

type SocialRecord = {
  twitter: string | null;
  linkedin: string | null;
  github: string | null;
  instagram: string | null;
  youtube: string | null;
  portfolio: string | null;
};

const ensureProfile = (adminId: string) =>
  prisma.adminProfile.upsert({
    where: { adminId },
    create: { adminId },
    update: {},
    include: { admin: true, socials: true },
  });

const safelyDestroyAvatar = async (publicId: string) => {
  try {
    await destroyCloudinaryAsset(publicId);
  } catch (error) {
    console.error("[PROFILE] Failed to clean up Cloudinary avatar:", error);
  }
};

const mapSocials = (socials: SocialRecord | null | undefined) => ({
  twitter: socials?.twitter ?? null,
  linkedin: socials?.linkedin ?? null,
  github: socials?.github ?? null,
  instagram: socials?.instagram ?? null,
  youtube: socials?.youtube ?? null,
  portfolio: socials?.portfolio ?? null,
});

const mapProfile = (profile: Awaited<ReturnType<typeof ensureProfile>>) => ({
  id: profile.admin.id,
  fullName: profile.admin.name,
  username: profile.admin.username || "",
  email: profile.admin.email,
  role: profile.admin.role.toLowerCase(),
  bio: profile.admin.bio || "",
  location: profile.location || "",
  website: profile.website || "",
  avatar: profile.admin.avatarUrl,
  socialLinks: mapSocials(profile.socials),
  updatedAt: profile.updatedAt.toISOString(),
});

export const profileService = {
  async getProfile(adminId: string) {
    return mapProfile(await ensureProfile(adminId));
  },

  async updateProfile(adminId: string, input: UpdateProfileInput) {
    const [emailOwner, usernameOwner] = await Promise.all([
      prisma.adminUser.findUnique({ where: { email: input.email }, select: { id: true } }),
      prisma.adminUser.findUnique({ where: { username: input.username }, select: { id: true } }),
    ]);

    if (emailOwner && emailOwner.id !== adminId) throw new Error("Email address is already in use.");
    if (usernameOwner && usernameOwner.id !== adminId) throw new Error("Username is already in use.");

    await prisma.$transaction(async (tx) => {
      await tx.adminUser.update({
        where: { id: adminId },
        data: {
          name: input.fullName,
          username: input.username,
          email: input.email,
          role: input.role,
          bio: input.bio ?? null,
        },
      });

      await tx.adminProfile.upsert({
        where: { adminId },
        create: {
          adminId,
          location: input.location,
          website: input.website,
        },
        update: {
          location: input.location,
          website: input.website,
          updatedAt: new Date(),
        },
      });
    });

    return this.getProfile(adminId);
  },

  async getSocials(adminId: string) {
    const profile = await ensureProfile(adminId);
    return mapSocials(profile.socials);
  },

  async updateSocials(adminId: string, input: SocialProfileInput) {
    const profile = await prisma.adminProfile.upsert({
      where: { adminId },
      create: { adminId },
      update: { updatedAt: new Date() },
    });

    const socials = await prisma.socialProfile.upsert({
      where: { profileId: profile.id },
      create: { profileId: profile.id, ...input },
      update: input,
    });

    return mapSocials(socials);
  },

  async getStats(adminId: string) {
    const publishedWhere: Prisma.PostWhereInput = {
      authorId: adminId,
      status: PostStatus.PUBLISHED,
    };

    const [articles, viewAggregate, categories] = await Promise.all([
      prisma.post.count({ where: publishedWhere }),
      prisma.post.aggregate({ where: publishedWhere, _sum: { views: true } }),
      prisma.post.findMany({
        where: { ...publishedWhere, categoryId: { not: null } },
        distinct: ["categoryId"],
        select: { categoryId: true },
      }),
    ]);

    return {
      articles,
      views: viewAggregate._sum.views || 0,
      topics: categories.length,
    };
  },

  async uploadAvatar(adminId: string, file: Express.Multer.File) {
    const existing = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { avatarPublicId: true },
    });
    if (!existing) throw new Error("Admin profile not found.");

    const upload = await uploadBufferToCloudinary(file.buffer, {
      folder: "blog-platform/profiles",
      resourceType: "image",
      originalFilename: file.originalname,
    });

    try {
      await prisma.$transaction(async (tx) => {
        await tx.adminUser.update({
          where: { id: adminId },
          data: {
            avatarUrl: upload.url,
            avatarPublicId: upload.publicId,
          },
        });

        await tx.adminProfile.upsert({
          where: { adminId },
          create: { adminId },
          update: { updatedAt: new Date() },
        });

        await tx.media.create({
          data: {
            url: upload.url,
            publicId: upload.publicId,
            folder: "blog-platform/profiles",
            resourceType: upload.resourceType,
            mimeType: file.mimetype,
            format: upload.format ?? null,
            bytes: upload.bytes ?? null,
            width: upload.width ?? null,
            height: upload.height ?? null,
            usedFor: MediaUsage.PROFILE_IMAGE,
            uploadedById: adminId,
          },
        });

        if (existing.avatarPublicId) {
          await tx.media.deleteMany({ where: { publicId: existing.avatarPublicId } });
        }
      });
    } catch (error) {
      await safelyDestroyAvatar(upload.publicId);
      throw error;
    }

    if (existing.avatarPublicId) {
      await safelyDestroyAvatar(existing.avatarPublicId);
    }

    return this.getProfile(adminId);
  },
};
