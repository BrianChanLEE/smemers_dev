// src/controller/userController.ts
import prisma from '@/src/lib/prisma'; // Prisma Client 인스턴스
import {sendVerificationEmail} from '@/src/lib/mailer'; // nodemailer를 사용하는 이메일 전송 함수
import {validateEmail} from '@/src/middleware/validate';
import Logger from '@/src/middleware/logger';
import {HttpRequest} from '@/types/interface/user_Interface';
import {signJwtAccessToken, signJwtRefreshToken} from '@/src/lib/jwt';
const logger = new Logger('logs');

/**
 * 사용자 회원가입 처리 함수
 * 이 함수는 사용자의 회원가입 요청을 처리합니다. 사용자가 제공한 이메일과 검증 코드를 사용하여 회원가입 절차를 수행합니다.
 *
 * @param {Object} req 요청 객체. 이메일, 검증 코드, 이름 등 회원가입에 필요한 데이터를 포함합니다.
 * @returns {Response} 회원가입 결과에 대한 응답.
 *                     이메일이나 검증 코드가 누락된 경우 401(Unauthorized) 상태 코드와 오류 메시지 반환.
 *                     이메일이 이미 사용 중인 경우 409(Conflict) 상태 코드와 오류 메시지 반환.
 *                     검증 코드가 무효하거나 만료된 경우 400(Bad Request) 상태 코드와 오류 메시지 반환.
 *                     회원가입 성공 시 200 상태 코드, JWT 토큰, Refresh 토큰, 사용자 정보를 포함한 응답 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 이메일과 검증 코드의 유효성 검사.
 * 2. 이메일 중복 확인.
 * 3. 검증 코드의 유효성 확인.
 * 4. 사용자 데이터 생성 및 저장.
 * 5. 사용자 검증 상태 업데이트.
 * 6. JWT 및 Refresh 토큰 생성 및 반환.
 * 7. 에러 발생 시 적절한 상태 코드와 메시지 반환.
 */

export async function registerUser(req: any) {
  logger.info('회원가입 처리 시작');
  try {
    // 이메일 및 검증 코드 누락 확인
    if (!req.email || !req.verificationCode) {
      logger.info('이메일 또는 검증 코드 누락');

      // 이메일 또는 검증 코드가 누락된 경우 401 (Unauthorized) 상태 코드와 오류 메시지를 반환
      return new Response(
        JSON.stringify({error: '이메일 또는 검증 코드 누락'}),
        {status: 401},
      );
    }

    logger.info(`이메일 ${req.email}로 사용자 중복 확인`);
    // 이메일 중복 확인

    // 이메일 형식 검증
    if (!validateEmail(req.email)) {
      logger.info('유효하지 않은 이메일 형식');
      return new Response(
        JSON.stringify({error: '유효하지 않은 이메일 형식'}),
        {status: 400},
      );
    }
    const existingUser = await prisma.user.findUnique({
      where: {email: req.email},
    });
    console.log('existingUser :', existingUser);
    if (existingUser) {
      logger.info(`이메일 ${req.email}은(는) 이미 사용 중`);
      // 이미 등록된 이메일인 경우 409 (Conflict) 상태 코드와 오류 메시지를 반환
      return new Response(
        JSON.stringify({error: '이메일이 이미 사용 중입니다.'}),
        {
          status: 409,
        },
      );
    }

    // 검증 코드 확인
    logger.info(`이메일 ${req.email}로 검증 코드 확인 중`);
    const validCode = await prisma.verification_codes.findFirst({
      where: {
        email: req.email,
        verification_code: req.verificationCode,
      },
    });
    console.log('validCode :', validCode);
    logger.info(
      `prisma.verification_codes.findFirst ${req.email},${req.name},${req.verificationCode},`,
    );
    if (!validCode) {
      logger.info(`이메일 ${req.email}의 검증 코드 무효 또는 만료`);

      // 검증 코드가 무효하거나 만료된 경우 400 (Bad Request) 상태 코드와 오류 메시지를 반환
      return new Response(
        JSON.stringify({
          error: '검증 코드가 유효하지 않거나 만료되었습니다.',
        }),
        {status: 400},
      );
    }

    // 사용자 데이터 저장
    logger.info(`이메일 ${req.email}로 사용자 생성 중`);
    const user = await prisma.user.create({
      data: {
        email: req.email,
        name: req.name,
        verificationCode: req.verificationCode,
        createdAt: new Date(),
        isVerified: false,
      },
    });
    console.log('newUser :', user);
    logger.info(
      `prisma.user.create ${req.email},${req.name},${req.verificationCode},`,
    );
    // 사용자를 성공적으로 등록한 후 isVerified를 true로 업데이트
    logger.info(`이메일 ${req.email} 사용자 생성 및 검증 상태 업데이트 중`);
    const updatedUser = await prisma.user.update({
      where: {
        email: req.email,
      },
      data: {
        isVerified: true,
        updatedAt: new Date(),
      },
    });
    console.log('updatedUser :', updatedUser);
    // JWT 토큰 payload 최적화
    const payload = {
      id: user!.id.toString(),
      name: user!.name,
      email: user!.email,
      role: user!.role,
      referral_code: user!.referral_code,
    };

    // // JWT 토큰 생성
    const accessToken = signJwtAccessToken(payload);

    // RefreshToken 생성
    const refreshToken = signJwtRefreshToken(payload);
    try {
      // 사용자의 Refresh Token을 데이터베이스에 저장하거나 업데이트
      await prisma.user.update({
        where: {id: user!.id},
        data: {refreshToken: refreshToken},
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Refresh Token 업데이트 중 오류 발생: ' + error.message);
        // DB 업데이트 실패 시 적절한 처리 필요
      }
    }
    // 로그인 성공 시 반환할 결과 객체
    const result = {
      // 필요한 사용자 정보만 포함
      ...updatedUser,
      id: updatedUser.id.toString(),
      // id: user!.id.toString(),

      // 추가 필드 추가
      refreshToken,
      accessToken,
    };

    const responseBody = JSON.stringify({
      success: true,
      message: '로그인 성공',
      data: result,
    });
    const responseHeaders = new Headers();
    responseHeaders.append('Authorization', `Bearer ${accessToken}`);
    // responseHeaders.append("Refresh-Token", refreshToken);

    return new Response(responseBody, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    // 에러를 더 세부적으로 처리하고 적절한 응답 반환
    if (error instanceof Error) {
      // 오류 발생 시 오류 메시지 출력
      logger.error('회원가입 처리 중 오류 발생: ' + error.message);
      logger.info(
        ` 회원가입 처리 중 오류 발생: ${req.email},${req.name},${req.verificationCode}`,
      );
      // 서버 내부 오류인 경우 500 (Internal Server Error) 상태 코드와 오류 메시지를 반환
      return new Response(JSON.stringify({error: error.message}), {
        status: 500,
      });
    }
  }
}

/************************************************************************************************************\

/**
 * 사용자 로그인 처리 함수
 * 이 함수는 사용자의 로그인 요청을 처리합니다. 사용자가 제공한 이메일과 검증 코드를 사용하여 로그인 절차를 수행합니다.
 *
 * @param {Object} req 요청 객체. 사용자의 이메일과 검증 코드를 포함합니다.
 * @returns {Response} 로그인 결과에 대한 응답.
 *                     이메일 또는 검증 코드 누락 시 400(Bad Request) 상태 코드와 오류 메시지 반환.
 *                     해당 이메일로 등록된 사용자가 없는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     검증 코드가 무효하거나 만료된 경우 400(Bad Request) 상태 코드와 오류 메시지 반환.
 *                     로그인 성공 시 200 상태 코드, JWT 토큰, Refresh 토큰, 사용자 정보를 포함한 응답 반환.
 *                     Refresh Token 저장 또는 업데이트 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 이메일과 검증 코드의 유효성 검사.
 * 2. 해당 이메일로 등록된 사용자 존재 여부 확인.
 * 3. 검증 코드의 유효성 확인 및 로그인 처리.
 * 4. JWT 및 Refresh 토큰 생성 및 데이터베이스에 Refresh Token 저장 또는 업데이트.
 * 5. 로그인 성공 응답 반환 (JWT 토큰, Refresh 토큰, 사용자 정보 포함).
 * 6. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */

export async function loginUser(req: HttpRequest) {
  try {
    if (!req.email || !req.verificationCode) {
      logger.info('로그인 정보 (이메일 또는 검증 코드) 누락');

      // 이메일 또는 검증 코드가 누락된 경우 400 (Bad Request) 상태 코드와 오류 메시지를 반환
      return new Response(
        JSON.stringify({error: '이메일과 검증 코드를 입력해 주세요.'}),
        {status: 400},
      );
    }

    logger.info(`이메일 ${req.email}로 사용자 확인 중`);

    // 이메일 형식 검증
    if (!validateEmail(req.email)) {
      logger.info('유효하지 않은 이메일 형식');
      return new Response(
        JSON.stringify({error: '유효하지 않은 이메일 형식'}),
        {status: 400},
      );
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: {email: req.email},
    });
    console.log('user :', user);

    logger.info(` 로그인 사용자 조회: ${req.email}`);

    // 사용자가 존재하지 않는 경우
    if (!user) {
      logger.info(`이메일 ${req.email} 사용자 없음 - 회원가입 요청`);

      return new Response(
        JSON.stringify({
          error: '해당 이메일로 등록된 사용자가 없습니다. 회원가입을 해주세요.',
        }),
        {status: 404},
      );
    }

    // 검증 코드 확인
    logger.info(`이메일 ${req.email}로 검증 코드 확인 중`);
    const validCode = await prisma.user.findFirst({
      where: {
        email: req.email,
        verificationCode: req.verificationCode,
      },
    });
    console.log('validCode :', validCode);
    if (!validCode) {
      logger.info(`이메일 ${req.email}의 검증 코드 무효 또는 만료`);

      // 검증 코드가 무효하거나 만료된 경우 400 (Bad Request) 상태 코드와 오류 메시지를 반환
      return new Response(
        JSON.stringify({
          error: '검증 코드가 유효하지 않거나 만료되었습니다.',
        }),
        {status: 400},
      );
    } else {
      // JWT 토큰 payload 최적화
      const payload = {
        id: user!.id.toString(),
        email: user!.email,
        role: user!.role,
        referral_code: user!.referral_code,
        name: user!.name,
      };

      // // JWT 토큰 생성
      const accessToken = signJwtAccessToken(payload);

      // RefreshToken 생성
      const refreshToken = signJwtRefreshToken(payload);
      try {
        // 사용자의 Refresh Token을 데이터베이스에 저장하거나 업데이트
        await prisma.user.update({
          where: {id: user!.id},
          data: {refreshToken: refreshToken},
        });
      } catch (error) {
        if (error instanceof Error) {
          logger.error('Refresh Token 업데이트 중 오류 발생: ' + error.message);
          // DB 업데이트 실패 시 적절한 처리 필요
        }
      }
      // 로그인 성공 시 반환할 결과 객체
      const result = {
        // 필요한 사용자 정보만 포함
        id: user!.id.toString(),

        // 추가 필드 추가
        refreshToken,
        accessToken,
      };

      const responseBody = JSON.stringify({
        success: true,
        message: '로그인 성공',
        data: result,
      });
      const responseHeaders = new Headers();
      responseHeaders.append('Authorization', `Bearer ${accessToken}`);
      // responseHeaders.append("Refresh-Token", refreshToken);

      return new Response(responseBody, {
        status: 200,
        headers: responseHeaders,
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      // 예외를 더 세부적으로 처리하고 적절한 응답 반환
      logger.error('로그인 처리 중 오류 발생: ' + error.message);

      // 서버 내부 오류인 경우 500 (Internal Server Error) 상태 코드와 오류 메시지를 반환
      return new Response(JSON.stringify({error: '서버 내부 오류 발생'}), {
        status: 500,
      });
    }
  }
}

/************************************************************************************************************/

/**
 * 검증 코드 발송 처리 함수
 * 이 함수는 사용자 이메일 주소로 검증 코드를 발송합니다. 사용자가 존재하지 않는 경우, 새로운 검증 코드를 생성하여 DB에 저장하고, 기존 사용자인 경우 검증 코드를 업데이트합니다.
 *
 * @param {Object} req 요청 객체. 사용자의 이메일 주소를 포함합니다.
 * @returns {Response} 검증 코드 발송 결과에 대한 응답.
 *                     새 사용자 생성 및 검증 코드 발송 성공 시, 201(Created) 상태 코드와 성공 메시지 반환.
 *                     검증 코드 이메일 발송 실패 시, 502(Bad Gateway) 상태 코드와 실패 메시지 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 이메일 주소로 사용자 확인.
 * 2. 새 사용자인 경우, 검증 코드 생성 및 DB 저장.
 *    기존 사용자인 경우, 검증 코드 업데이트.
 * 3. 생성된 검증 코드 1분 후 만료 처리 (30초 후 null 업데이트).
 * 4. 이메일로 검증 코드 전송.
 * 5. 이메일 전송 결과에 따라 적절한 응답 반환.
 * 6. 오류 발생 시 오류 메시지와 함께 오류 응답 반환.
 */

export async function sendVerificationCode(req: any) {
  try {
    // 사용자 확인
    logger.info(`이메일 ${req.email}로 사용자 확인`);

    const user = await prisma.user.findUnique({
      where: {email: req.email},
    });

    // 이메일 형식 검증
    if (!validateEmail(req.email)) {
      logger.info('유효하지 않은 이메일 형식');
      return new Response(
        JSON.stringify({error: '유효하지 않은 이메일 형식'}),
        {status: 400},
      );
    }

    // 검증 코드 생성
    const verificationCode = Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 180000); //3분제한

    if (!user) {
      // 새 사용자인 경우, 검증 코드를 DB에 저장
      logger.info(
        `이메일 ${req.email}에 해당하는 새 사용자, 검증 코드 생성 및 DB 저장`,
      );
      const verificationCodeEntry = await prisma.verification_codes.create({
        data: {
          email: req.email,
          verification_code: verificationCode,
          expires_at: expiresAt,
        },
        select: {
          id: true, // 생성된 엔트리의 ID를 받아옵니다.
        },
      });
      // startCountdown(60);
      // 30초 후에 검증 코드를 null로 업데이트
      setTimeout(async () => {
        try {
          await prisma.verification_codes.update({
            where: {
              id: verificationCodeEntry.id, // 생성된 엔트리의 ID를 사용합니다.
            },
            data: {
              verification_code: '', // "" 빈문자열로 검증 코드 null로 업데이트
            },
          });
          logger.info(`이메일 ${req.email}의 검증 코드 만료 처리 완료`);
        } catch (error) {
          if (error instanceof Error) {
            logger.error(`검증 코드 만료 처리 중 오류: ${error.message}`);
          }
        }
      }, 180000); // 1분 (60000밀리초) 후 실행
    } else {
      // 기존 사용자인 경우, 사용자의 검증 코드를 업데이트
      logger.info(
        `이메일 ${req.email}에 해당하는 기존 사용자, 검증 코드 업데이트`,
      );
      await prisma.user.update({
        where: {email: req.email},
        data: {verificationCode: verificationCode},
      });
      // startCountdown(60);
      // 30초 후에 검증 코드를 null로 업데이트
      setTimeout(async () => {
        try {
          await prisma.user.update({
            where: {
              email: req.email,
            },
            data: {
              verificationCode: null, // 검증 코드 null로 업데이트
            },
          });
          logger.info(`이메일 ${req.email}의 검증 코드 만료 처리 완료`);
        } catch (error) {
          if (error instanceof Error) {
            logger.error(`검증 코드 만료 처리 중 오류: ${error.message}`);
          }
        }
      }, 180000); // 1분 (60000밀리초) 후 실행
    }
    // 정기적으로 만료된 인증 코드를 정리하는 함수

    // 이메일 전송
    const emailSendResult = await sendVerificationEmail(
      req.email,
      verificationCode,
    );
    if (emailSendResult.success) {
      logger.info(`이메일 ${req.email}로 검증 코드 성공적으로 전송`);
      return new Response(
        JSON.stringify({
          success: true,
          message: '새 사용자 생성 및 검증 코드 발송 성공',
          statusCode: 201, // Created
        }),
      );
    } else {
      logger.info(`이메일 ${req.email}로 검증 코드 전송 실패`);
      return new Response(
        JSON.stringify({
          success: false,
          message: '검증 코드 이메일 발송 실패',
          statusCode: 502, // Bad Gateway
        }),
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`검증 코드 발송 중 오류 발생: ${error.message}`);
      return new Response(
        JSON.stringify({
          success: false,
          message: `서버 내부 오류: ${error.message}`,
          statusCode: 500, // Internal Server Error
        }),
      );
    }
  }
}

/************************************************************************************************************/

/**
 * 사용자 계정 삭제 함수
 * 이 함수는 특정 사용자의 계정을 영구적으로 삭제합니다. 주어진 사용자 ID를 기반으로 사용자 계정을 조회하고, 해당 계정을 데이터베이스에서 삭제합니다.
 *
 * @param {any} userId 사용자의 고유 ID. 사용자 계정을 식별하기 위해 사용됩니다.
 * @returns {Response} 처리 결과에 대한 응답.
 *                     사용자 ID가 누락된 경우 400(Bad Request) 상태 코드와 오류 메시지 반환.
 *                     해당 사용자를 찾을 수 없는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     계정 삭제 성공 시 200 상태 코드와 성공 메시지 반환.
 *                     서버 내부 오류 또는 특정 오류 조건 발생 시 500(Internal Server Error) 또는 적절한 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자 ID의 유효성 검증.
 * 2. 데이터베이스에서 해당 사용자 조회.
 * 3. 사용자 계정 삭제 처리.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function removeMemberAccount(userId: any) {
  try {
    // 입력 검증
    if (!userId) {
      logger.info('사용자 ID 누락');
      return new Response(
        JSON.stringify({error: '사용자 ID가 필요합니다.'}),
        {status: 400}, // Bad Request
      );
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({where: {id: userId}});
    if (!user) {
      logger.info('해당 사용자를 찾을 수 없음');
      return new Response(
        JSON.stringify({error: '해당 사용자를 찾을 수 없습니다.'}),
        {status: 404}, // Not Found
      );
    }

    // 사용자 계정 삭제 처리
    await prisma.user.delete({
      where: {id: userId},
    });

    logger.info('성공적으로 탈퇴되었습니다.');
    return new Response(
      JSON.stringify({message: '성공적으로 탈퇴되었습니다.'}),
      {status: 200}, // OK
    );
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`탈퇴 처리 중 오류 발생: ${error.message}`);

      // 오류의 세부 유형에 따라 다른 상태 코드를 반환할 수 있습니다.
      if (error.message.includes('Record to delete does not exist.')) {
        return new Response(
          JSON.stringify({error: '삭제할 사용자가 존재하지 않습니다.'}),
          {status: 404}, // Not Found
        );
      }

      return new Response(
        JSON.stringify({error: '내부 서버 오류', message: error.message}),
        {status: 500},
      );
    }
  }
}

/************************************************************************************************************/
/**
 * 사용자 계정 비활성화 함수
 * 이 함수는 특정 사용자의 계정을 비활성화합니다. 주어진 사용자 ID를 기반으로 사용자 계정을 조회하고, 계정을 비활성화 상태로 변경합니다.
 *
 * @param {any} userId 사용자의 고유 ID. 사용자 계정을 식별하기 위해 사용됩니다.
 * @returns {Response} 처리 결과에 대한 응답.
 *                     사용자 ID가 누락된 경우 400(Bad Request) 상태 코드와 오류 메시지 반환.
 *                     해당 사용자를 찾을 수 없는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     계정이 이미 비활성화된 경우 409(Conflict) 상태 코드와 오류 메시지 반환.
 *                     계정 비활성화 성공 시 200 상태 코드와 성공 메시지 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자 ID의 유효성 검증.
 * 2. 데이터베이스에서 해당 사용자 조회.
 * 3. 사용자의 비활성화 여부 확인 및 비활성화 처리.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function disabledMemberAccount(userId: any) {
  try {
    // 입력 검증
    if (!userId) {
      logger.info('사용자 ID 누락');
      return new Response(
        JSON.stringify({error: '사용자 ID가 필요합니다.'}),
        {status: 400}, // Bad Request
      );
    }

    console.log('userId :', userId);

    // 사용자 조회
    const user = await prisma.user.findUnique({where: {id: userId}});
    if (!user) {
      logger.info('해당 사용자를 찾을 수 없음');
      return new Response(
        JSON.stringify({error: '해당 사용자를 찾을 수 없습니다.'}),
        {status: 404}, // Not Found
      );
    }

    // 이미 비활성화된 계정인지 확인
    if (user.disabled) {
      logger.info('계정이 이미 비활성화됨');
      return new Response(
        JSON.stringify({error: '계정이 이미 비활성화되었습니다.'}),
        {status: 409}, // Conflict
      );
    }

    // 사용자 계정 비활성화 처리
    await prisma.user.update({
      where: {id: userId},
      data: {disabled: true},
    });

    logger.info('계정이 성공적으로 비활성화되었습니다.');
    return new Response(
      JSON.stringify({message: '성공적으로 탈퇴되었습니다.'}),
      {status: 200}, // OK
    );
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`계정 비활성화 처리 중 오류 발생: ${error.message}`);
      return new Response(JSON.stringify({error: '서버 내부 오류 발생'}), {
        status: 500, // Internal Server Error
      });
    }
  }
}

//  // 약관 동의 정보 처리
//     if (
//       !req.TermsOfServiceAgreement ||
//       !req.PersonalInformationCollection ||
//       !req.PersonalInformationProcessing === undefined
//     ) {
//       // 필수 약관 동의 항목 누락 시 오류 반환
//       return new Response(
//         JSON.stringify({ error: "필수 약관 동의 항목이 누락되었습니다." }),
//         { status: 400 }
//       );
//     } else {
//       // 약관 정보 저장
//       await prisma.terms.create({
//         data: {
//           TermsID: user.id, // 사용자 ID 사용
//           TermsOfServiceAgreement: req.TermsOfServiceAgreement,
//           PersonalInformationCollection: req.PersonalInformationCollection,
//           PersonalInformationProcessing: req.PersonalInformationProcessing,
//           AdvertisingInformationReception: req.AdvertisingInformationReception,
//         },
//       });
//     }
