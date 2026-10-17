-- The links of the ads count who registered by their mark (docs/184, docs/116), through an index
-- (docs/117). Only the marks of the ads: the numbers of «Statistika» keep the index of the time.
CREATE INDEX user_arrivals_ad ON user_arrivals (via) WHERE via LIKE 'ad-%';
