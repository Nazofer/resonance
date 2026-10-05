-- OmniVoice 'auto' (language-agnostic) is replaced by 'match' (follow the detected text language)
UPDATE "Generation"
SET "settings" = jsonb_set("settings", '{language}', '"match"')
WHERE "model" = 'omnivoice' AND "settings"->>'language' = 'auto';
