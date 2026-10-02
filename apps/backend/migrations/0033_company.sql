-- G34: the requisites of the company in the legal documents (docs/30). The owner enters them in
-- the admin Mini App; every save is a new row, so the history keeps every edition. No start row:
-- until the first save the documents name the brand.
CREATE TABLE company_versions (
  version INTEGER PRIMARY KEY AUTOINCREMENT,
  legal_name TEXT NOT NULL,
  form TEXT NOT NULL,
  stir TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT NOT NULL,
  changed_by INTEGER NOT NULL,
  changed_at INTEGER NOT NULL
);
