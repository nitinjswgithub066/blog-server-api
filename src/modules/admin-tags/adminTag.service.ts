import { prisma } from "../../config/prisma";
import { slugify } from "../../utils/slugify";

export const getAdminTagsService = async () =>
  prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

export const createAdminTagService = async (name: string) => {
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Tag name is required.");

  return prisma.tag.upsert({
    where: { slug: slugify(cleanName) },
    create: {
      name: cleanName,
      slug: slugify(cleanName),
    },
    update: {
      name: cleanName,
    },
  });
};
