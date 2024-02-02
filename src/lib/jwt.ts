import jwt, {JwtPayload} from 'jsonwebtoken';
import Logger from '@/src/middleware/logger';
const logger = new Logger('logs');

interface SignOption {
  expiresIn?: string | number;
}

const DEFAULT_SIGN_OPTION: SignOption = {
  expiresIn: '5h',
};

// RefreshToken에 대한 기본 만료 시간 설정
const DEFAULT_REFRESH_SIGN_OPTION: SignOption = {
  expiresIn: '7d', // 예: 7일
};

export function signJwtAccessToken(
  payload: JwtPayload,
  options: SignOption = DEFAULT_SIGN_OPTION,
) {
  try {
    const secret_key = process.env.SECRET_KEY;
    if (!secret_key) {
      throw new Error('SECRET_KEY 환경 변수가 설정되어 있지 않습니다.');
    }

    // BigInt 값을 문자열로 변환
    // payload.verificationCode = payload.verificationCode.toString();

    const token = jwt.sign(payload, secret_key, options);
    return token;
  } catch (error) {
    if (error instanceof Error) {
      logger.error('JWT 토큰 생성 중 오류 발생: ' + error.message);
      throw new Error('JWT 토큰 생성에 실패했습니다.');
    }
  }
}
export function verifyJwt(token: string) {
  try {
    const secret_key = process.env.SECRET_KEY;
    if (!secret_key) {
      throw new Error('SECRET_KEY 환경 변수가 설정되어 있지 않습니다.');
    }

    const decoded = jwt.verify(token, secret_key);
    return decoded as JwtPayload;
  } catch (error) {
    if (error instanceof Error) {
      logger.error('JWT 토큰 검증 중 오류 발생: ' + error.message);
      return null;
    }
  }
}

// RefreshToken 생성 함수
export function signJwtRefreshToken(
  payload: JwtPayload,
  options: SignOption = DEFAULT_REFRESH_SIGN_OPTION,
) {
  try {
    const secret_key = process.env.REFRESH_SECRET_KEY; // 별도의 refresh secret key 사용
    if (!secret_key) {
      throw new Error('REFRESH_SECRET_KEY 환경 변수가 설정되어 있지 않습니다.');
    }

    const refreshToken = jwt.sign(payload, secret_key, options);
    return refreshToken;
  } catch (error) {
    if (error instanceof Error) {
      logger.error('JWT Refresh 토큰 생성 중 오류 발생: ' + error.message);
      throw new Error('JWT Refresh 토큰 생성에 실패했습니다.');
    }
  }
}

// RefreshToken 검증 함수
export function verifyJwtRefreshToken(token: string) {
  try {
    const secret_key = process.env.REFRESH_SECRET_KEY;
    if (!secret_key) {
      throw new Error('REFRESH_SECRET_KEY 환경 변수가 설정되어 있지 않습니다.');
    }

    const decoded = jwt.verify(token, secret_key);
    return decoded as JwtPayload;
  } catch (error) {
    if (error instanceof Error) {
      logger.error('JWT Refresh 토큰 검증 중 오류 발생: ' + error.message);
      return null;
    }
  }
}
