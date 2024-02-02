export interface NotifyMembershipForStoreRequest {
  userId: number;
  store_deactivate: boolean;
  title: string;
  message: string;
  CreateDate: Date;
}
export interface Token {
  id: any;
}

export interface NotifyMembershipForInfluencerRequest {
  userId: number;
  store_Id: number;
  influencer_Id: number;
  store_deactivate: boolean;
  title: string;
  message: string;
  CreateDate: Date;
}

export interface NotifyForNoticesRequest {
  userId: number;
  status: Notices_status;
  CreateDate: Date;
  title: string;
  message: string;
}

enum Notices_status {
  Public = 'PUBLIC',
  Private = 'PRIVATE',
}

export interface Notification {
  user_Id: any;
  title: string;
  message: string;
}

export type NotificationType = {
  id: bigint;
  title: string;
  message: string;
  isRead: boolean;
  user_Id: bigint;
  influencer_Id: bigint;
  store_Id: bigint;
  notice_Id: bigint;
  membership_Id: bigint;
};
