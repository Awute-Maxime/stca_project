-- CreateTable
CREATE TABLE "vin_index" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "signature" TEXT NOT NULL,
    "marqueModele" TEXT NOT NULL,
    "nbVus" INTEGER NOT NULL DEFAULT 1,
    "source" TEXT NOT NULL DEFAULT 'seed',
    "majLe" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vin_index_annee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "signature" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "nb" INTEGER NOT NULL DEFAULT 1
);

-- CreateIndex
CREATE INDEX "vin_index_signature_idx" ON "vin_index"("signature");

-- CreateIndex
CREATE UNIQUE INDEX "vin_index_signature_marqueModele_key" ON "vin_index"("signature", "marqueModele");

-- CreateIndex
CREATE INDEX "vin_index_annee_signature_idx" ON "vin_index_annee"("signature");

-- CreateIndex
CREATE UNIQUE INDEX "vin_index_annee_signature_annee_key" ON "vin_index_annee"("signature", "annee");
