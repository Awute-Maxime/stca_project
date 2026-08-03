-- CreateTable
CREATE TABLE "vin_index_info" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "signature" TEXT NOT NULL,
    "carrosserie" TEXT,
    "version" TEXT,
    "segment" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "vin_index_info_signature_key" ON "vin_index_info"("signature");
