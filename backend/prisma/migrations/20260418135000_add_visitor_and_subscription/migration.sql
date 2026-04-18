-- CreateTable Subscription
CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "visitorId" TEXT,
  "tagSlugs" TEXT[],
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Subscription_email_key" ON "Subscription"("email");
CREATE INDEX "Subscription_visitorId_idx" ON "Subscription"("visitorId");

-- CreateTable VisitorProfile
CREATE TABLE "VisitorProfile" (
  "id" TEXT NOT NULL,
  "tagWeights" JSONB NOT NULL DEFAULT '{}',
  "slugWeights" JSONB NOT NULL DEFAULT '{}',
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VisitorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable SlugVisit
CREATE TABLE "SlugVisit" (
  "id" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SlugVisit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SlugVisit_visitorId_slug_idx" ON "SlugVisit"("visitorId","slug");
CREATE INDEX "SlugVisit_slug_createdAt_idx" ON "SlugVisit"("slug","createdAt");

-- CreateTable PostRead
CREATE TABLE "PostRead" (
  "id" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostRead_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PostRead_visitorId_postId_idx" ON "PostRead"("visitorId","postId");
CREATE INDEX "PostRead_postId_createdAt_idx" ON "PostRead"("postId","createdAt");
