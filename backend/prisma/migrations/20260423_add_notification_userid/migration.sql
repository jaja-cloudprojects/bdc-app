ALTER TABLE "Notification" ADD COLUMN "userId" TEXT;
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
