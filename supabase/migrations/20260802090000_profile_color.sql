alter table public.profiles
  add column profile_color text not null default '#A83D16';

alter table public.profiles
  add constraint profiles_profile_color_check
  check (profile_color in (
    '#A83D16', '#B84A1B', '#C75A24', '#9B4F2F', '#8F3E2E', '#A45C28', '#B96A25', '#95622E',
    '#80613B', '#6F6139', '#6F7040', '#71774A', '#5D754B', '#497454', '#4A6D5E', '#4B6A68',
    '#496673', '#4C607B', '#565C83', '#695B83', '#795979', '#895A70', '#995966', '#9B514F',
    '#874838', '#754E33', '#705A32', '#66613A', '#586744', '#4B6950', '#49655C', '#4C5E68'
  ));
