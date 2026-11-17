-- CreateTable
CREATE TABLE "media_files" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

