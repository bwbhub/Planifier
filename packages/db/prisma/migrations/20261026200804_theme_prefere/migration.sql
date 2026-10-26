-- Thème préféré : chaîne libre remplacée par un enum. Colonne recréée : aucun environnement déployé,
-- aucune donnée à reprendre (project-context §5).
-- CreateEnum
CREATE TYPE "theme_preference" AS ENUM ('SYSTEM', 'LIGHT', 'DARK');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "preferred_theme",
ADD COLUMN     "preferred_theme" "theme_preference" NOT NULL DEFAULT 'SYSTEM';
