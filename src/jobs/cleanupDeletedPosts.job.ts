import cron from "node-cron";
import { PostStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { destroyCloudinaryAsset } from "../services/cloudinary.service";

const isReferencedOutsidePost = async (publicId: string, postId: string) => {
  const [postReferences, mediaReferences] = await Promise.all([
    prisma.post.count({
      where: {
        id: { not: postId },
        OR: [
          { coverImagePublicId: publicId },
          { originalDocumentPublicId: publicId },
        ],
      },
    }),
    prisma.media.count({
      where: {
        publicId,
        postId: { not: postId },
        NOT: { postId: null },
      },
    }),
  ]);

  return postReferences + mediaReferences > 0;
};

export const cleanupDeletedPostsJob = cron.schedule("30 2 * * *", async () => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);

    const posts = await prisma.post.findMany({
      where: {
        status: PostStatus.DELETED,
        deletedAt: { lte: cutoff },
      },
      include: {
        media: true,
      },
      take: 100,
    });

    if (posts.length === 0) {
      return;
    }

    let deletedPosts = 0;
    let deletedAssets = 0;
    let skippedAssets = 0;

    for (const post of posts) {
      const assets = new Map<string, string | null | undefined>();

      if (post.coverImagePublicId) {
        assets.set(post.coverImagePublicId, "image");
      }

      if (post.originalDocumentPublicId) {
        assets.set(post.originalDocumentPublicId, "raw");
      }

      for (const media of post.media) {
        assets.set(media.publicId, media.resourceType);
      }

      const assetPublicIds = Array.from(assets.keys());
      if (assetPublicIds.length > 0) {
        const matchingMedia = await prisma.media.findMany({
          where: { publicId: { in: assetPublicIds } },
          select: { publicId: true, resourceType: true },
        });

        for (const media of matchingMedia) {
          assets.set(media.publicId, media.resourceType);
        }
      }

      for (const [publicId, resourceType] of assets.entries()) {
        if (await isReferencedOutsidePost(publicId, post.id)) {
          skippedAssets++;
          continue;
        }

        try {
          await destroyCloudinaryAsset(publicId, resourceType);
          deletedAssets++;
        } catch (error) {
          skippedAssets++;
          console.error(`[CRON] Failed to delete Cloudinary asset ${publicId}:`, error);
        }
      }

      await prisma.media.deleteMany({
        where: {
          OR: [
            { postId: post.id },
            ...(assets.size > 0 ? [{ publicId: { in: Array.from(assets.keys()) } }] : []),
          ],
        },
      });
      await prisma.post.delete({ where: { id: post.id } });
      deletedPosts++;
    }

    console.log(
      `[CRON] Deleted-post cleanup completed. Posts: ${deletedPosts}, assets deleted: ${deletedAssets}, assets skipped: ${skippedAssets}.`
    );
  } catch (error) {
    console.error("[CRON] Error in cleanupDeletedPostsJob:", error);
  }
}, { scheduled: false } as any);
