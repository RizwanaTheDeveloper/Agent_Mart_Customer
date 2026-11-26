-- Open pgAdmin Query Tool on the agentmart_customer database and run the whole file.
-- This creates a SEPARATE agentmart schema. Existing public tables/data are untouched.
-- All changes run in one transaction; conflicts stop the script without partial creation.
-- Run once. If the schema already contains tables, inspect it before retrying.
BEGIN;
SELECT pg_advisory_xact_lock(731940223185);
DO $agentmart_check$
BEGIN
  IF current_database() <> 'agentmart_customer' THEN
    RAISE EXCEPTION 'Select the agentmart_customer database before running this script.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'agentmart' AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
  ) THEN
    RAISE EXCEPTION 'The agentmart schema already contains tables or views. No tables have been changed. Inspect before migrating.';
  END IF;
END
$agentmart_check$;
CREATE SCHEMA IF NOT EXISTS "agentmart";
SET LOCAL search_path TO "agentmart", pg_catalog;

-- Generated initial PostgreSQL schema. This command does not apply it to a database.
-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('BUYER', 'SELLER');

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'MANAGER', 'AGENT', 'VIEWER');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'AVAILABLE', 'ON_HOLD', 'SOLD', 'RENTED');

-- CreateEnum
CREATE TYPE "PropertyPurpose" AS ENUM ('SALE', 'RENT');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CLOSED');

-- CreateEnum
CREATE TYPE "EnquiryStage" AS ENUM ('NEW_INTEREST', 'CONTACTED', 'DOCUMENTS_REQUESTED', 'VISIT_PLANNING', 'NEGOTIATION', 'COMPLETED', 'NOT_PROCEEDING');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AccountRole" NOT NULL DEFAULT 'BUYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Firm" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "ownerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Firm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirmMember" (
    "firmId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "branchId" UUID,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'VIEWER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FirmMember_pkey" PRIMARY KEY ("firmId","userId")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" UUID NOT NULL,
    "firmId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyType" (
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "PropertyType_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" UUID NOT NULL,
    "firmId" UUID NOT NULL,
    "branchId" UUID,
    "ownerId" UUID NOT NULL,
    "assignedToId" UUID,
    "typeCode" VARCHAR(32) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "purpose" "PropertyPurpose" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(18,2) NOT NULL,
    "area" DECIMAL(18,4) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "city" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "facing" TEXT,
    "bedrooms" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedProperty" (
    "userId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedProperty_pkey" PRIMARY KEY ("userId","propertyId")
);

-- CreateTable
CREATE TABLE "ComparedProperty" (
    "userId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComparedProperty_pkey" PRIMARY KEY ("userId","propertyId")
);

-- CreateTable
CREATE TABLE "EnquiryDraft" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "message" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnquiryDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" UUID NOT NULL,
    "firmId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "buyerId" UUID,
    "assignedToId" UUID,
    "requestId" VARCHAR(100),
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(254),
    "phone" VARCHAR(20),
    "message" VARCHAR(2000) NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "status" "EnquiryStatus" NOT NULL DEFAULT 'PENDING',
    "stage" "EnquiryStage" NOT NULL DEFAULT 'NEW_INTEREST',
    "nextAt" TIMESTAMP(3),
    "history" JSONB NOT NULL DEFAULT '[]',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteVisit" (
    "id" UUID NOT NULL,
    "firmId" UUID NOT NULL,
    "enquiryId" UUID NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'PROPOSED',
    "buyerConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SiteVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "firmId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "filename" VARCHAR(150) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "encryptionIv" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "firmId" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "FirmMember_userId_active_idx" ON "FirmMember"("userId", "active");

-- CreateIndex
CREATE INDEX "Branch_firmId_idx" ON "Branch"("firmId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_id_firmId_key" ON "Branch"("id", "firmId");

-- CreateIndex
CREATE INDEX "Property_firmId_status_idx" ON "Property"("firmId", "status");

-- CreateIndex
CREATE INDEX "Property_published_status_city_idx" ON "Property"("published", "status", "city");

-- CreateIndex
CREATE INDEX "Property_assignedToId_idx" ON "Property"("assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "Property_id_firmId_key" ON "Property"("id", "firmId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyImage_storageKey_key" ON "PropertyImage"("storageKey");

-- CreateIndex
CREATE INDEX "PropertyImage_propertyId_position_idx" ON "PropertyImage"("propertyId", "position");

-- CreateIndex
CREATE INDEX "EnquiryDraft_userId_createdAt_idx" ON "EnquiryDraft"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Enquiry_firmId_status_nextAt_idx" ON "Enquiry"("firmId", "status", "nextAt");

-- CreateIndex
CREATE INDEX "Enquiry_assignedToId_idx" ON "Enquiry"("assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "Enquiry_id_firmId_key" ON "Enquiry"("id", "firmId");

-- CreateIndex
CREATE UNIQUE INDEX "Enquiry_buyerId_requestId_key" ON "Enquiry"("buyerId", "requestId");

-- CreateIndex
CREATE INDEX "SiteVisit_firmId_scheduledAt_idx" ON "SiteVisit"("firmId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Document_storageKey_key" ON "Document"("storageKey");

-- CreateIndex
CREATE INDEX "Document_firmId_propertyId_idx" ON "Document"("firmId", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshSession_userId_expiresAt_idx" ON "RefreshSession"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_firmId_createdAt_idx" ON "AuditLog"("firmId", "createdAt");

-- AddForeignKey
ALTER TABLE "Firm" ADD CONSTRAINT "Firm_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmMember" ADD CONSTRAINT "FirmMember_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmMember" ADD CONSTRAINT "FirmMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmMember" ADD CONSTRAINT "FirmMember_branchId_firmId_fkey" FOREIGN KEY ("branchId", "firmId") REFERENCES "Branch"("id", "firmId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_branchId_firmId_fkey" FOREIGN KEY ("branchId", "firmId") REFERENCES "Branch"("id", "firmId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_typeCode_fkey" FOREIGN KEY ("typeCode") REFERENCES "PropertyType"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProperty" ADD CONSTRAINT "SavedProperty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProperty" ADD CONSTRAINT "SavedProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparedProperty" ADD CONSTRAINT "ComparedProperty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparedProperty" ADD CONSTRAINT "ComparedProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryDraft" ADD CONSTRAINT "EnquiryDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryDraft" ADD CONSTRAINT "EnquiryDraft_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_propertyId_firmId_fkey" FOREIGN KEY ("propertyId", "firmId") REFERENCES "Property"("id", "firmId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVisit" ADD CONSTRAINT "SiteVisit_enquiryId_firmId_fkey" FOREIGN KEY ("enquiryId", "firmId") REFERENCES "Enquiry"("id", "firmId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_propertyId_firmId_fkey" FOREIGN KEY ("propertyId", "firmId") REFERENCES "Property"("id", "firmId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Business invariants retained from property validation.
ALTER TABLE "Property" ADD CONSTRAINT "Property_positive_price" CHECK ("price" > 0);
ALTER TABLE "Property" ADD CONSTRAINT "Property_positive_area" CHECK ("area" > 0);

DO $agentmart_verify$
DECLARE model_count INTEGER;
BEGIN
  SELECT count(*) INTO model_count FROM information_schema.tables
  WHERE table_schema = 'agentmart' AND table_type = 'BASE TABLE';
  IF model_count <> 15 THEN RAISE EXCEPTION 'Expected 15 model tables, found %.', model_count; END IF;
END
$agentmart_verify$;
COMMIT;

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'agentmart' AND table_type = 'BASE TABLE'
ORDER BY table_name;
