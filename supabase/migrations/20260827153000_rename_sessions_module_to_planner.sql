insert into public.reserved_module_names (name)
values ('planner')
on conflict (name) do nothing;

delete from public.reserved_module_names
where name = 'sessions';
