export interface NoticeRequest {
  subject: string;
  contents: string;
  status: notices_status;
  StartDate: string;
  EndDate: string;
}

export interface Notice {
  subject: string;
  contents: string;
  user_id: any;
  StartDate: string;
  EndDate: string;
}

export interface NoticeUpdateData {
  subject: string;
  contents: string;
  StartDate: string;
  EndDate: string;
}

//사용안함
export interface createNoticeRequestBody {
  subject: string;
  contents: string;
}
//사용안함
export interface findPublished {
  status: boolean;
}
//사용안함
export interface noticesUpdateInput {
  subject?: string;
  contents?: string;
  status?: string;
  userId?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

enum notices_status {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}
