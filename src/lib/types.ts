export type Role = 'customer' | 'staff' | 'admin';

export type User = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
};
