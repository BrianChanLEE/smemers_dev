export interface CreateLikeNoticeData {
  notice_id: number;
  subject: string;
  contents: string;
  StartDate: Date | number;
  EndDate: Date | number;
}

export interface CreateLikeInfluencerData {
  influencer_id: number;
  account: string;
  image_url: string;
  contents: string;
  referral_code: string;
  website: string;
  enabled: boolean;
}

export interface CreateLikeStoreData {
  store_id: number;
  name: string;
  country: string;
  zip_code: string;
  address: string;
  address_etc: string;
  phone: string;
  open_time: string;
  close_time: string;
  open_days: string;
  website: string;
  images: string;
  discount_rate: string;
  kind: string;
  enabled: string;
}

export interface CreateLikeMembershipData {
  membership_id: number;
  subject: string;
  image: string;
  description: string;
  CreateDate: Date;
  expiration_Period: string;
  price: string;
  discount_rate: string;
}
export interface RemoveNoticeLikeData {
  disabled: boolean;
}
export interface RemoveNoticeLikeRequest {
  notice_id: number;
  user_id: number;
}

export interface RemoveInfluencerLikeData {
  disabled: boolean;
}

export interface RemoveInfluencerLikeRequest {
  influencer_id: number;
  user_id: number;
}

export interface RemoveStoreLikeData {
  disabled: boolean;
}

export interface RemoveStoreLikeRequest {
  store_id: number;
  user_id: number;
}
