-- bcrypt hash of 'hwadmin123'
insert into users (id, email, password_hash)
values ('00000000-0000-0000-0000-000000000001', 'admin@hw.test',
        '$2b$10$36nFUXz6lEsvYm9V.4/IZuBbEbCglHpfgHNYjfMdoCLgN6BVj3gwe')
on conflict (email) do nothing;

insert into profiles (id, email, name, role)
values ('00000000-0000-0000-0000-000000000001', 'admin@hw.test', 'HW Staff', 'admin')
on conflict (id) do nothing;
