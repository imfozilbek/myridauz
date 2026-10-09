-- G75: the car the team approved, kept with the decision (docs/158 К): a new car of an approved
-- driver shows the team what it replaces, «было → стало». JSON of the car, null for other decisions.
ALTER TABLE application_log ADD COLUMN car TEXT;
