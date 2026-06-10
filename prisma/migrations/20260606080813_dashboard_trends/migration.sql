-- CreateEnum
CREATE TYPE "TrendSource" AS ENUM ('INTERNAL_ANALYTICS', 'GOOGLE_SEARCH_CONSOLE', 'EXTERNAL_TRENDS');

-- CreateTable
CREATE TABLE "TrendSnapshot" (
    "id" TEXT NOT NULL,
    "source" "TrendSource" NOT NULL DEFAULT 'INTERNAL_ANALYTICS',
    "category" TEXT NOT NULL,
    "categorySlug" TEXT,
    "label" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "growth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "searchVolume" INTEGER,
    "suggestedTopic" TEXT,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrendSnapshot_source_idx" ON "TrendSnapshot"("source");

-- CreateIndex
CREATE INDEX "TrendSnapshot_categorySlug_idx" ON "TrendSnapshot"("categorySlug");

-- CreateIndex
CREATE INDEX "TrendSnapshot_snapshotDate_idx" ON "TrendSnapshot"("snapshotDate");
