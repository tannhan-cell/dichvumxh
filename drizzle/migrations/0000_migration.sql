create type public.app_role as enum ('admin');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- first registered user becomes admin
create or replace function public.handle_first_admin() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users for each row execute function public.handle_first_admin();

create table public.services (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  name text not null,
  unit_price numeric not null default 0,
  min_qty int not null default 100,
  max_qty int not null default 100000,
  badge text,
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.services to anon, authenticated; grant insert, update, delete on public.services to authenticated; grant all on public.services to service_role;
alter table public.services enable row level security;
create policy "public read active" on public.services for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "admin write" on public.services for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  platform text not null,
  link text not null,
  quantity int not null,
  note text,
  contact text not null,
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending','paid','running','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update, delete on public.orders to authenticated; grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "admin read orders" on public.orders for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin update orders" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin delete orders" on public.orders for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  tone text not null default 'info',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.announcements to anon, authenticated; grant insert, update, delete on public.announcements to authenticated; grant all on public.announcements to service_role;
alter table public.announcements enable row level security;
create policy "public read active ann" on public.announcements for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "admin write ann" on public.announcements for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
alter publication supabase_realtime add table public.announcements;

insert into public.services (platform,name,unit_price,min_qty,badge,sort) values
('facebook','Tăng LIKE bài viết',25,100,null,1),
('facebook','Tăng LIKE bài viết SALE',15,100,'SALE',2),
('facebook','Tăng FOLLOW cá nhân',35,100,null,3),
('facebook','Tăng LIKE + FOLLOW page',40,100,null,4),
('facebook','Tăng BÌNH LUẬN',300,10,null,5),
('facebook','Tăng VIEW video',5,1000,null,6),
('facebook','Tăng MẮT LIVE',20,50,null,7),
('facebook','Tăng MEM GROUP',30,100,null,8),
('facebook','Tăng SHARE bài viết',50,100,null,9),
('facebook','Tăng ĐÁNH GIÁ fanpage',500,10,null,10),
('facebook','Tăng LIKE BÌNH LUẬN',30,100,null,11),
('facebook','Tăng VIEW STORY',10,100,null,12),
('facebook','BOT tương tác',100000,1,null,13),
('facebook','Mua PROXY BOT tương tác',50000,1,null,14),
('facebook','MUA GROUP + PAGE',500000,1,'HOT',15),
('tiktok','MUA TÀI KHOẢN TIKTOK',150000,1,'HOT',1),
('tiktok','Tăng TIM',15,100,null,2),
('tiktok','Tăng theo dõi',40,100,null,3),
('tiktok','Tăng lượt xem',3,1000,null,4),
('tiktok','Tăng bình luận',300,10,null,5),
('tiktok','Tăng share',30,100,null,6),
('tiktok','Tăng save',20,100,null,7),
('tiktok','Tăng Mắt live',25,50,null,8),
('tiktok','VIP bình luận',600,10,'VIP',9),
('tiktok','VIP mắt',50,50,'VIP',10),
('instagram','Tăng TIM bài viết',20,100,null,1),
('instagram','Tăng THEO DÕI',45,100,null,2),
('instagram','Tăng BÌNH LUẬN',400,10,null,3),
('instagram','Tăng VIEW + LIVE',10,500,null,4),
('instagram','Tăng VIEW STORY',10,100,null,5),
('instagram','VIP-LIKE',40,100,'VIP',6),
('unlock','Mở khóa Facebook',500000,1,'KHÔI PHỤC',1),
('unlock','Mở khóa TikTok',500000,1,'KHÔI PHỤC',2),
('unlock','Bảo mật tài khoản',300000,1,'BẢO VỆ',3);

insert into public.announcements(message) values ('Chào mừng bạn đến với SocialMedia — đặt đơn và thanh toán QR chỉ trong 30 giây!');