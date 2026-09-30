-- G14: "Maʼlumotlarimni oʻchirish" (docs/30). The row stays for the records that point to it
-- (wallet journal, reviews, complaints), without a name, a phone or a photo.
ALTER TABLE users ADD COLUMN deleted_at INTEGER;
