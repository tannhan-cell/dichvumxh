CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  balance numeric NOT NULL DEFAULT 0,
  discount_percent numeric NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update profile" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin insert into public.profiles(id, email) values (new.id, new.email) on conflict do nothing; return new; end $$;
CREATE TRIGGER on_auth_user_created_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();
INSERT INTO public.profiles(id, email) SELECT id, email FROM auth.users ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.deduct_balance(_uid uuid, _amount numeric) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare n int; begin
  update public.profiles set balance = balance - _amount where id = _uid and balance >= _amount and _amount >= 0;
  get diagnostics n = row_count; return n = 1; end $$;
REVOKE ALL ON FUNCTION public.deduct_balance(uuid, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_balance(uuid, numeric) TO service_role;

ALTER TABLE public.orders ADD COLUMN user_id uuid;
ALTER TABLE public.orders ADD COLUMN paid_by_balance boolean NOT NULL DEFAULT false;
CREATE POLICY "own orders read" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.orders DROP CONSTRAINT orders_service_id_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;