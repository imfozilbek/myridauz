-- G31: the person sees answers from «Operator N»: one random number 1 … 200 for one question (docs/92).
ALTER TABLE assignments ADD COLUMN operator_no INTEGER;
