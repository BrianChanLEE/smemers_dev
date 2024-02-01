export interface bioAuthSettingRequest {
  bioAuthEnabled: boolean;
  bio_Auth: user_setting_bio_Auth;
}

export interface BioRequestBody {
  bioAuthEnabled: boolean;
  bio_Auth: user_setting_bio_Auth;
}

enum user_setting_bio_Auth {
  on = "ON",
  off = "OFF",
}

export interface notifySettingRequest {
  notifyEnabled: boolean;
  notify: user_setting_notify;
}

export interface NotifyRequestBody {
  notifyEnabled: boolean;
  notify: user_setting_notify;
}

enum user_setting_notify {
  on = "ON",
  off = "OFF",
}
