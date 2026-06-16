insert into wood_species (name, swatch_color, sort_order) values
  ('Oak', '#caa472', 1), ('Walnut', '#6b4f3a', 2), ('Cherry', '#8a4b34', 3), ('Maple', '#d8c19a', 4)
on conflict (name) do nothing;

insert into finishes (name, swatch_color, sort_order) values
  ('Natural Oil', '#caa472', 1), ('Honey', '#b8956a', 2), ('Chestnut', '#7a5230', 3), ('Espresso', '#3a2e24', 4)
on conflict (name) do nothing;
