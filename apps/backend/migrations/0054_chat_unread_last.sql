-- The last unread message of a chat and the side of the person in it (G68, docs/122): the sheet of
-- the open Mini App shows the words and answers them in one tap. Older rows have no side: both apps.
ALTER TABLE chat_unread ADD COLUMN role TEXT;
ALTER TABLE chat_unread ADD COLUMN text TEXT;
ALTER TABLE chat_unread ADD COLUMN at INTEGER;
