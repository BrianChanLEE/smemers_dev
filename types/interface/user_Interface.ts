export interface HttpRequest {
  email?: string;
  verificationCode: string;
  // 요청에 필요한 다른 필드들을 여기에 추가할 수 있습니다.
}

export interface RegisterRequestBody {
  name: string;
  email: string;
  verificationCode: number;
  createdAt: Date;
  isVerified: boolean;
}

export interface LoginRequestBody {
  email: string;
  verificationCode: string;
}

export interface SendVerificationCodeRequestBody {
  email: string;
  verificationCode: string;
}

export interface DisabledMemberAccount {
  userId: bigint;
}
