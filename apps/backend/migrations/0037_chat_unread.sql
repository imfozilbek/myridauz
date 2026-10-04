-- Messages a person has not seen yet in a chat (G53): the plate «1 xabar» on the main screen.
-- The chat adds one for the person who is not in it and forgets the row when they open it.
CREATE TABLE chat_unread (
  chat_key TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (chat_key, user_id)
);
CREATE INDEX chat_unread_user ON chat_unread (user_id);
