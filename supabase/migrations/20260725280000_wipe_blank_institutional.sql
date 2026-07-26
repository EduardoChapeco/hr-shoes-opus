-- Wipes the institutional document to allow the user to select the template again
DELETE FROM public.experience_documents WHERE slug = 'institucional';
