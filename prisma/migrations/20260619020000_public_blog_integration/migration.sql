ALTER TABLE "Comment"
ADD COLUMN "parentId" TEXT,
ALTER COLUMN "isApproved" SET DEFAULT true;

CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

ALTER TABLE "Comment"
ADD CONSTRAINT "Comment_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "Comment"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PostView" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "visitorKey" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PostView_postId_visitorKey_bucket_key"
ON "PostView"("postId", "visitorKey", "bucket");

CREATE INDEX "PostView_postId_idx" ON "PostView"("postId");
CREATE INDEX "PostView_createdAt_idx" ON "PostView"("createdAt");

ALTER TABLE "PostView"
ADD CONSTRAINT "PostView_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "Post"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
