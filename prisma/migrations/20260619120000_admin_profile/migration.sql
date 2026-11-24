CREATE TABLE "AdminProfile" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "location" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialProfile" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "twitter" TEXT,
    "linkedin" TEXT,
    "github" TEXT,
    "instagram" TEXT,
    "youtube" TEXT,
    "portfolio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminProfile_adminId_key" ON "AdminProfile"("adminId");
CREATE INDEX "AdminProfile_adminId_idx" ON "AdminProfile"("adminId");
CREATE UNIQUE INDEX "SocialProfile_profileId_key" ON "SocialProfile"("profileId");
CREATE INDEX "SocialProfile_profileId_idx" ON "SocialProfile"("profileId");

ALTER TABLE "AdminProfile"
ADD CONSTRAINT "AdminProfile_adminId_fkey"
FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialProfile"
ADD CONSTRAINT "SocialProfile_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "AdminProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
