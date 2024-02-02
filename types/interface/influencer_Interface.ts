export interface createInfluencerData {
  account: string;
  image_url: string;
  contents: string;
  referral_code: string;
  website: Influencer_website;
}

enum Influencer_website {
  Instagram = 'instagram',
  Tiktok = 'tiktok',
  Twitter = 'twitter',
  Facebook = 'facebook',
}

export interface EnabledInfluencerData {
  enabled: boolean;
}

export interface UpdateInfluencerData {
  account: string;
  image_url: string;
  contents: string;
  referral_code: string;
  website: Influencer_website;
}

export interface Token {
  id: any;
}
