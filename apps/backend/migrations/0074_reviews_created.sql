-- «Statistika» sums the reviews of a period (G87 V2, docs/191): read through the time, not the table.
CREATE INDEX reviews_created ON reviews (created_at);
