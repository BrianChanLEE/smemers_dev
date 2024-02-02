export interface Token {
  id: any;
  name: string;
  email: string;
  role: user_role;
  referral_code: string;
}

enum user_role {
  Admin = 'admin',
  User = 'user',
  Influencer = 'influencer',
  Store = 'store',
}
