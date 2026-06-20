
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL,
  summary text NOT NULL,
  body text NOT NULL,
  images text[] NOT NULL DEFAULT '{}',
  submitter_name text NOT NULL,
  submitter_email text,
  category text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','reverted')),
  click_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads published articles" ON public.articles
  FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins read all articles" ON public.articles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Anyone can submit" ON public.articles
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'published' AND click_count = 0);
CREATE POLICY "Admins update articles" ON public.articles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete articles" ON public.articles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE INDEX articles_published_idx ON public.articles (status, published_at DESC);

CREATE TABLE public.article_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  clicked_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.article_clicks TO anon, authenticated;
GRANT SELECT ON public.article_clicks TO authenticated;
GRANT ALL ON public.article_clicks TO service_role;
ALTER TABLE public.article_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone records click" ON public.article_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read clicks" ON public.article_clicks FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX article_clicks_recent_idx ON public.article_clicks (article_id, clicked_at DESC);
