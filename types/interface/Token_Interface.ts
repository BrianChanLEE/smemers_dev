export interface Token {
  id: any;
  name: String;
  email: String;
  role: user_role;
  referral_code: String;
}

enum user_role {
  Admin = "admin",
  User = "user",
  Influencer = "influencer",
  Store = "store",
}
