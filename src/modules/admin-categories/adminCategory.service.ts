import { prisma } from "../../config/prisma";
import { slugify } from "../../utils/slugify";

const DEFAULT_CATEGORIES = [
  "Technology",
  "AI",
  "Career",
  "Animation",
  "Product Reviews",
  "Programming",
  "Gaming",
  "Thoughts",
];

export const ensureDefaultCategoriesService = async () => {
  for (const name of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: slugify(name) },
      create: { name, slug: slugify(name) },
      update: { name },
    });
  }
};

export const getAdminCategoriesService = async () => {
  await ensureDefaultCategoriesService();
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { posts: true } },
    },
  });
};

export const createAdminCategoryService = async (name: string) => {
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Category name is required.");

  return prisma.category.upsert({
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

export const deleteAdminCategoryService = async (id: string) => {
  const postCount = await prisma.post.count({ where: { categoryId: id } });
  if (postCount > 0) {
    throw new Error("This category is used by posts. Reassign or delete those posts first.");
  }

  await prisma.category.delete({ where: { id } });
};
