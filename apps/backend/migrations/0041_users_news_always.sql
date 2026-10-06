-- G58 (docs/125 №11): «Bot xabarlari» are always on, the profile switch is gone.
ALTER TABLE users DROP COLUMN news_off;
