export interface CreateStore {
  name: string;
  zip_code: string;
  address_etc: string;
  phone: string;
  // open_time: string;
  // close_time: string;
  // open_days: string;
  // website: string;
  // images: string;
  // discount_rate: string;
  // enabled: string;
  // kind: string;
  // referral_code: string;
  // lat: string;
  // lng: string;
  country: string;
  address: string;
  user_id: number;
}
export interface CreateStoreRequest {
  name: string;
  zip_code: string;
  address_etc: string;
  phone: string;
  open_time: string;
  close_time: string;
  open_days: string;
  website: string;
  images: string;
  discount_rate: string;
  enabled: string;
  kind: string;
  referral_code: string;
  lat: string;
  lng: string;
  country: string;
  address: string;
}

export interface EnabledStoreData {
  enabled: boolean;
}

export interface UpdateStoreData {
  name: string;
  zip_code: string;
  address_etc: string;
  phone: string;
  open_time: string;
  close_time: string;
  open_days: string;
  website: string;
  images: string;
  discount_rate: string;
  enabled: string;
  kind: string;
  referral_code: string;
  lat: string;
  lng: string;
  country: string;
  address: string;
}

export interface Token {
  id: any;
}
