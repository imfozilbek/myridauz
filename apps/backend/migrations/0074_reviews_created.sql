-- G87 (docs/191): «Statistika» sums the ratings of a period; the index reads only that period.
CREATE INDEX reviews_created ON reviews (created_at);
