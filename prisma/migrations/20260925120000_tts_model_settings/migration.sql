-- Move Chatterbox-specific columns into per-model settings JSON
ALTER TABLE "Generation" ADD COLUMN "model" TEXT NOT NULL DEFAULT 'chatterbox',
ADD COLUMN "settings" JSONB;

UPDATE "Generation" SET "settings" = jsonb_build_object(
  'temperature', "temperature",
  'topP', "topP",
  'topK', "topK",
  'repetitionPenalty', "repetitionPenalty"
);

ALTER TABLE "Generation" ALTER COLUMN "settings" SET NOT NULL,
DROP COLUMN "temperature",
DROP COLUMN "topP",
DROP COLUMN "topK",
DROP COLUMN "repetitionPenalty";
