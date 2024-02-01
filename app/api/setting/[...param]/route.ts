import Logger from "@/src/middleware/logger";
import {
  BioRequestBody,
  NotifyRequestBody,
} from "@/types/interface/userSetting_Interface";
import {
  bioAuthSetting,
  notifySetting,
} from "@/src/_services/userSettingService";
import { verifyJwt } from "@/src/lib/jwt";

const handler = async (req: any, context: any) => {
  console.log("context :", context);
  const { params } = context;
  const method = req.method;
  const param1 = params.param[0] as String;
  const param2 = params.param[1] as Number;
  const accessToken = req.headers.get("authorization");

  const logger = new Logger("logs");
  // console.log("param1 :", param1);

  logger.info(`account API 요청: Method=${method}, Params=${param1}`);
  switch (method) {
    // PUT 요청 처리
    case "POST":
      try {
        if (param1 === "bioAuth") {
          // 로깅: 사용자 생체 인증 설정 변경 요청 시작
          logger.info(`사용자 생체 인증 설정 변경 요청 시작`);

          // 인증 토큰 확인
          if (!accessToken) {
            logger.error("인증 토큰 누락");
            return new Response(JSON.stringify({ error: "No Authorization" }), {
              status: 401,
            });
          }

          // 토큰 검증
          const token = verifyJwt(accessToken);
          if (!token || !token.id) {
            logger.error("인증 토큰 검증 실패");
            return new Response(JSON.stringify({ error: "Invalid token" }), {
              status: 401,
            });
          }
          logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);

          // 요청 본문 데이터를 JSON 형식으로 파싱
          const bioSetData = await req.json();

          // 요청 본문을 BioRequestBody 형식으로 형변환
          const bioSetBody: BioRequestBody = bioSetData;

          // 생체 인증 설정 변경 함수 호출
          const bioAuthSettingResult = await bioAuthSetting(bioSetBody, token);

          const resultData = await bioAuthSettingResult!.json();

          if (bioAuthSettingResult && bioAuthSettingResult.status === 200) {
            logger.info("사용자 생체 인증 설정 변경 성공");
            return new Response(
              JSON.stringify({
                success: true,
                message: "User bio authentication setting updated successfully",
                data: resultData,
              }),
              { status: 200 }
            );
          } else {
            logger.error("사용자 생체 인증 설정 변경 실패");
            return new Response(
              JSON.stringify({
                success: false,
                message: "User bio authentication setting update failed",
                data: resultData,
              }),
              { status: 500 }
            );
          }
        }
        // PUT 요청 처리
        if (param1 === "notifySetting") {
          // 로깅: 사용자 알림 설정 변경 요청 시작
          logger.info("사용자 알림 설정 변경 요청 시작");

          // 인증 토큰 확인
          if (!accessToken) {
            logger.error("인증 토큰 누락");
            return new Response(JSON.stringify({ error: "인증되지 않음" }), {
              status: 401,
            });
          }

          // 토큰 검증
          const token = verifyJwt(accessToken);
          if (!token || !token.id) {
            logger.error("인증 토큰 검증 실패");
            return new Response(
              JSON.stringify({ error: "유효하지 않은 토큰" }),
              {
                status: 401,
              }
            );
          }
          logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);

          // 요청 본문 데이터를 JSON 형식으로 파싱
          const notifySetData = await req.json();

          // 요청 본문을 NotifyRequestBody 형식으로 형변환
          const notifySetBody: NotifyRequestBody = notifySetData;

          // 알림 설정 변경 함수 호출
          const notifySettingResult = await notifySetting(notifySetBody, token);

          const resultData = await notifySettingResult!.json();

          if (notifySettingResult && notifySettingResult.status === 200) {
            logger.info("사용자 알림 설정 변경 성공");
            return new Response(
              JSON.stringify({
                success: true,
                message: "사용자 알림 설정이 성공적으로 변경됨",
                data: resultData,
              }),
              { status: 200 }
            );
          } else {
            logger.error("사용자 알림 설정 변경 실패");
            return new Response(
              JSON.stringify({
                success: false,
                message: "사용자 알림 설정 변경에 실패함",
                data: resultData,
              }),
              { status: 500 }
            );
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`오류 발생: ${error.message}`);
          return new Response(
            JSON.stringify({
              error: "Internal Server Error",
              message: error.message,
            }),
            { status: 500 }
          );
        }
      }
      break;

    default:
      // 로그 정보 기록: 알 수 없는 요청
      logger.error(`알 수 없는 요청: ${method}`);

      // 400 (Bad Request) 상태 코드와 함께 알 수 없는 요청 응답 반환
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
      });
  }
};

export { handler as POST };
