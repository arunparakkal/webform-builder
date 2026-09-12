-- Slugs are unique per owner (tenant), not globally.
-- Public URLs become /f/:ownerId/:slug

DROP INDEX IF EXISTS "forms_slug_key";

CREATE UNIQUE INDEX "forms_owner_id_slug_key" ON "forms"("owner_id", "slug");
