/*
  Warnings:

  - Added the required column `cellNumber` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surname` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workAddress` to the `users` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "cellNumber" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "workAddress" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "id", "name", "surname", "password", "cellNumber", "company", "position", "workAddress", "role", "updatedAt") 
SELECT "createdAt", "email", "id", 
COALESCE("name", 'Unknown') as "name", 
'Unknown' as "surname", 
"password", 
'Not provided' as "cellNumber", 
'Not provided' as "company", 
'Not provided' as "position", 
'Not provided' as "workAddress", 
"role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
