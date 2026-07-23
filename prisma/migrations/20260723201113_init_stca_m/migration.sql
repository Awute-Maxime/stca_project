-- CreateTable
CREATE TABLE "categorie_vehicule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rang" INTEGER NOT NULL,
    "nom" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "destination" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "lettre" TEXT NOT NULL DEFAULT '',
    "tarif" INTEGER NOT NULL DEFAULT 10000,
    "numImmatActuel" INTEGER NOT NULL DEFAULT 0,
    "couleur" TEXT NOT NULL DEFAULT '#2563EB',
    "contact" TEXT,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "marque_modele" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "marque" TEXT NOT NULL,
    "modele" TEXT,
    "libelle" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "pays" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "iso3" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "continent" TEXT,
    "codeOTR" TEXT
);

-- CreateTable
CREATE TABLE "assureur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "coordonnees" TEXT
);

-- CreateTable
CREATE TABLE "tarif_assurance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assureurId" INTEGER NOT NULL,
    "categorieRang" INTEGER NOT NULL,
    "tarif" INTEGER NOT NULL,
    "taxe" INTEGER NOT NULL,
    "commissionPct" INTEGER NOT NULL,
    "rc" INTEGER NOT NULL DEFAULT 0,
    "cedeao" INTEGER NOT NULL DEFAULT 0,
    "individuelle" INTEGER NOT NULL DEFAULT 0,
    "accessoires" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "tarif_assurance_assureurId_fkey" FOREIGN KEY ("assureurId") REFERENCES "assureur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "enregistrement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numRef" INTEGER NOT NULL,
    "nomPrenomProprio" TEXT NOT NULL,
    "adresseProprio" TEXT,
    "ancienneImmatriculation" TEXT,
    "dateAncienneCG" DATETIME,
    "categorieRang" INTEGER,
    "codeTransit" TEXT NOT NULL,
    "maisonTransit" TEXT,
    "nomDuParc" TEXT,
    "marqueModele" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "numTri" TEXT,
    "numImmatriculation" TEXT NOT NULL,
    "montant" INTEGER NOT NULL DEFAULT 10000,
    "dateEnreg" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "flagSortie" BOOLEAN NOT NULL DEFAULT false,
    "dateSortie" DATETIME,
    "nomUtilisateur" TEXT,
    "assureurId" INTEGER,
    "dateArchivage" DATETIME,
    "archivePar" TEXT
);

-- CreateTable
CREATE TABLE "utilisateur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "login" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "administrateur" BOOLEAN NOT NULL DEFAULT false,
    "compteActif" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "parametre" (
    "cle" TEXT NOT NULL PRIMARY KEY,
    "valeur" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "categorie_vehicule_rang_key" ON "categorie_vehicule"("rang");

-- CreateIndex
CREATE UNIQUE INDEX "destination_code_key" ON "destination"("code");

-- CreateIndex
CREATE UNIQUE INDEX "marque_modele_libelle_key" ON "marque_modele"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "pays_nom_key" ON "pays"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "tarif_assurance_assureurId_categorieRang_key" ON "tarif_assurance"("assureurId", "categorieRang");

-- CreateIndex
CREATE UNIQUE INDEX "enregistrement_numRef_key" ON "enregistrement"("numRef");

-- CreateIndex
CREATE UNIQUE INDEX "enregistrement_vin_key" ON "enregistrement"("vin");

-- CreateIndex
CREATE INDEX "enregistrement_dateEnreg_idx" ON "enregistrement"("dateEnreg");

-- CreateIndex
CREATE INDEX "enregistrement_codeTransit_dateEnreg_idx" ON "enregistrement"("codeTransit", "dateEnreg");

-- CreateIndex
CREATE INDEX "enregistrement_flagSortie_dateSortie_idx" ON "enregistrement"("flagSortie", "dateSortie");

-- CreateIndex
CREATE INDEX "enregistrement_dateArchivage_idx" ON "enregistrement"("dateArchivage");

-- CreateIndex
CREATE UNIQUE INDEX "enregistrement_numImmatriculation_codeTransit_key" ON "enregistrement"("numImmatriculation", "codeTransit");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateur_login_key" ON "utilisateur"("login");
