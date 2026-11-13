-- G86 T5 (docs/122): the newest state a live card should show. Two requests that change one card at
-- the same moment give one edit: a queued edit whose state is not the wanted one anymore is not sent.
ALTER TABLE bot_cards ADD COLUMN wanted TEXT;
