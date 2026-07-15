DELETE FROM auth.users WHERE email = 'hrshoes_test_1784081368088@gmail.com';

-- Let's check how many users/profiles exist now
SELECT count(*) FROM auth.users;
SELECT count(*) FROM public.profiles;
