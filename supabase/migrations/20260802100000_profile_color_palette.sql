alter table public.profiles
  drop constraint if exists profiles_profile_color_check;

alter table public.profiles
  add constraint profiles_profile_color_check
  check (profile_color in (
    '#A83D16', '#C24B30', '#C9652E', '#B77A22', '#917A20', '#747D27', '#4F7B38', '#2F7B52',
    '#20756A', '#1F6F7C', '#276A8C', '#3B5F99', '#4B6A68', '#514F98', '#684E92', '#824B87',
    '#9B4775', '#AD3D62', '#9F393F', '#8E3C30', '#754E33', '#705A32', '#66613A', '#586744',
    '#3F6E4D', '#2C6C61', '#265F73', '#36577F', '#4D4C86', '#65477E', '#7B416B', '#944052'
  ));
