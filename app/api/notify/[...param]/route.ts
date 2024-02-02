import Logger from '@/src/middleware/logger';
import {
  notifyForNotices,
  notifyMembershipForStore,
  notifyMembershipForInfluencer,
} from '@/src/_services/notificationService';
import {verifyJwt} from '@/src/lib/jwt';
import {Token} from '@/types/interface/Token_Interface';

const handler = async (req: any, context: any) => {
  console.log('context :', context);
  const {params} = context;
  const method = req.method;
  const param1 = params.param[0] as string;
  const accessToken = req.headers.get('authorization');

  const logger = new Logger('logs');
  // console.log("param1 :", param1);

  logger.info(`notify API 요청: Method=${method}`);
  switch (method) {
    // POST 요청 처리
    case 'GET':
      try {
        if (param1 === 'notify') {
          // 로깅: 새 공지사항 알림 생성 요청 시작
          logger.info('새 공지사항 알림 생성 요청 시작');

          // 인증 토큰 검증
          if (!accessToken) {
            logger.error('인증 토큰 누락');
            return new Response(JSON.stringify({error: '인증이 필요합니다.'}), {
              status: 401,
            });
          }

          const jwtPayload = verifyJwt(accessToken);
          if (!jwtPayload || !jwtPayload.id) {
            logger.error('인증 토큰 검증 실패');
            return new Response(
              JSON.stringify({error: '접근 권한이 없습니다.'}),
              {status: 403},
            );
          }

          const token: Token = {
            id: jwtPayload.id,
            name: jwtPayload.name,
            email: jwtPayload.email,
            referral_code: jwtPayload.referral_code,
            role: jwtPayload.role,
          };

          // 공지사항 알림 생성 함수 호출
          const notifyResult = await notifyForNotices(token);
          if (!notifyResult) {
            logger.error('알림 서비스 응답 없음');
            return new Response(
              JSON.stringify({error: '알림 서비스 응답을 받을 수 없습니다.'}),
              {status: 503},
            );
          }

          const resultData = await notifyResult.json();

          if (resultData.success) {
            logger.info('새 공지사항 알림 생성 성공');
            return new Response(
              JSON.stringify({
                success: true,
                message: '새 공지사항 알림이 성공적으로 생성되었습니다.',
                data: resultData.data,
              }),
              {status: 201},
            );
          } else {
            logger.error('새 공지사항 알림 생성 실패');
            return new Response(
              JSON.stringify({
                success: false,
                message: '새 공지사항 알림 생성에 실패했습니다.',
                error: resultData.error,
              }),
              {status: 500},
            );
          }
        }
        // POST 요청 처리
        if (param1 === 'MembershipForStore') {
          // 로깅: 스토어 멤버십에 대한 사용자 알림 생성 요청 시작
          logger.info('스토어 멤버십에 대한 사용자 알림 생성 요청 시작');

          // 인증 토큰 검증
          if (!accessToken) {
            logger.error('인증 토큰 누락');
            return new Response(JSON.stringify({error: '인증이 필요합니다.'}), {
              status: 401,
            });
          }

          const jwtPayload = verifyJwt(accessToken);
          if (!jwtPayload || !jwtPayload.id) {
            logger.error('인증 토큰 검증 실패');
            return new Response(
              JSON.stringify({error: '접근 권한이 없습니다.'}),
              {status: 403},
            );
          }

          const token: Token = {
            id: jwtPayload.id,
            name: jwtPayload.name,
            email: jwtPayload.email,
            referral_code: jwtPayload.referral_code,
            role: jwtPayload.role,
          };

          const notifyResults = await notifyMembershipForStore(token);

          if (!notifyResults) {
            logger.error('알림 서비스 응답 없음');
            return new Response(
              JSON.stringify({error: '알림 서비스 응답을 받을 수 없습니다.'}),
              {status: 503},
            );
          }

          const resultData = await notifyResults.json();

          if (resultData.success) {
            logger.info('스토어 멤버십에 대한 사용자 알림 생성 성공');
            return new Response(
              JSON.stringify({
                success: true,
                message: '스토어 멤버십에 대한 사용자 알림이 성공적으로 생성됨',
                data: resultData.data,
              }),
              {status: 201},
            );
          } else {
            logger.error('스토어 멤버십에 대한 사용자 알림 생성 실패');
            return new Response(
              JSON.stringify({
                success: false,
                message: '스토어 멤버십에 대한 사용자 알림 생성에 실패함',
                error: resultData.error,
              }),
              {status: 500},
            );
          }
        }

        if (param1 === 'MembershipForInfluencer') {
          logger.info('공지사항에 대한 사용자 알림 생성 요청 시작');

          if (!accessToken) {
            logger.error('인증 토큰 누락');
            return new Response(JSON.stringify({error: '인증이 필요합니다.'}), {
              status: 401,
            });
          }

          const jwtPayload = verifyJwt(accessToken);
          if (!jwtPayload || !jwtPayload.id) {
            logger.error('인증 토큰 검증 실패');
            return new Response(
              JSON.stringify({error: '접근 권한이 없습니다.'}),
              {status: 403},
            );
          }

          const token = {
            id: jwtPayload.id,
            name: jwtPayload.name,
            email: jwtPayload.email,
            referral_code: jwtPayload.referral_code,
            role: jwtPayload.role,
          };

          const notifyResult = await notifyMembershipForInfluencer(token);

          if (!notifyResult) {
            logger.error('알림 서비스 응답 없음');
            return new Response(
              JSON.stringify({error: '알림 서비스 응답을 받을 수 없습니다.'}),
              {status: 503},
            );
          }

          const resultData = await notifyResult.json();

          if (resultData.success) {
            logger.info('인플루언서 맴버쉽에 대한 사용자 알림 생성 성공');
            return new Response(
              JSON.stringify({
                success: true,
                message:
                  '인플루언서 맴버쉽에 대한 사용자 알림이 성공적으로 생성됨',
                data: resultData.data,
              }),
              {status: 201},
            );
          } else {
            logger.error('인플루언서 맴버쉽에 대한 사용자 알림 생성 실패');
            return new Response(
              JSON.stringify({
                success: false,
                message: '인플루언서 맴버쉽에 대한 사용자 알림 생성에 실패함',
                error: resultData.error,
              }),
              {status: 500},
            );
          }
        } else {
          logger.error(`알 수 없는 요청: ${param1}`);
          return new Response(JSON.stringify({error: '잘못된 요청'}), {
            status: 400,
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`알림 생성 중 오류 발생: ${error.message}`);
          return new Response(
            JSON.stringify({
              error: '내부 서버 오류',
              message: error.message,
            }),
            {status: 500},
          );
        }
      }
      break;

    default:
      // 로그 정보 기록: 알 수 없는 요청
      logger.error(`알 수 없는 요청: ${method}`);

      // 400 (Bad Request) 상태 코드와 함께 알 수 없는 요청 응답 반환
      return new Response(JSON.stringify({error: 'Invalid request'}), {
        status: 400,
      });
  }
};

export {handler as GET};
