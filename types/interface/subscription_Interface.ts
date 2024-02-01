export interface SubInfluencers {
  user_Id: number;
  influencer_Id: number;
  influencer_deactivate: boolean;
}

export interface SubInfluencerRequest {
  user_Id: number;
  influencer_Id: number;
  influencer_deactivate: boolean;
}

export interface SubStores {
  user_Id: number;
  store_Id: number;
  store_deactivate: boolean;
}

export interface SubStoreRequest {
  user_Id: number;
  store_Id: number;
  store_deactivate: boolean;
}

export interface SubMemberships {
  user_Id: number;
  membership_Id: number;
  membership_deactivate: boolean;
}
export interface SubMembershipRequest {
  user_Id: number;
  membership_Id: number;
  membership_deactivate: boolean;
}

// export interface MembershipRequest {
//   user_Id: number;
//   membership_Id: number;
//   membership_deactivate: boolean;
// }

// export interface UpdateInfluencerSubData {
//   influencer_deactivate: boolean;
// }

// export interface UpdateInfluencerSubRequest {
//   user_Id: number;
//   influencer_Id: number;
//   influencer_deactivate: boolean;
// }

// export interface UpdateStoreSubData {
//   store_deactivate: boolean;
// }

// export interface UpdateStoreSubRequest {
//   user_Id: number;
//   store_Id: number;
//   store_deactivate: boolean;
// }

// export interface UpdateMembershipSubData {
//   membership_deactivate: boolean;
// }

// export interface UpdateMembershipSubRequest {
//   user_Id: number;
//   membership_Id: number;
//   membership_deactivate: boolean;
// }

// export interface Token {
//   id: any;
// }
