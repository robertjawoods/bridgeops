-- AlterTable
ALTER TABLE "user" ADD COLUMN     "activeWorkspaceId" TEXT;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_activeWorkspaceId_fkey" FOREIGN KEY ("activeWorkspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
