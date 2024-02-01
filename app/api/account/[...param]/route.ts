import Logger from "@/src/middleware/logger";
import {
  RegisterRequestBody,
  LoginRequestBody,
  SendVerificationCodeRequestBody,
} from "@/types/interface/user_Interface";
import {
  loginUser,
  registerUser,
  sendVerificationCode,
  removeMemberAccount,
  disabledMemberAccount,
} from "@/src/_services/userService";
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
    case "POST":
      try {
        if (param1 === "login") {
          // 로그 정보 기록: 로그인 요청 처리 시작
          logger.info("로그인 요청 처리 시작");

          // 요청 본문 데이터를 JSON 형식으로 파싱
          const loginData = await req.json();

          // 요청 본문을 LoginRequestBody 형식으로 형변환
          const loginBody: LoginRequestBody = loginData;

          // 이메일 또는 검증 코드 누락 확인
          if (!loginBody.email || !loginBody.verificationCode) {
            logger.info("로그인 실패 - 이메일 또는 검증 코드 누락");
            return new Response(
              JSON.stringify({
                success: false,
                message: "이메일 또는 검증 코드 누락",
              }),
              { status: 400 }
            );
          }

          // 사용자 로그인 함수 호출
          const loginResult = await loginUser(loginBody);

          // 로그인 결과 확인
          if (!loginResult) {
            // 해당 이메일로 등록된 사용자가 없는 경우
            logger.info("로그인 실패 - 사용자 없음");
            return new Response(
              JSON.stringify({
                success: false,
                message: "해당 이메일로 등록된 사용자 없음",
              }),
              { status: 404 }
            );
          } else if (loginResult.status === 400) {
            // 검증 코드 무효 또는 만료된 경우
            logger.info("로그인 실패 - 검증 코드 문제");
            return new Response(
              JSON.stringify({
                success: false,
                message: "검증 코드 무효 또는 만료",
              }),
              { status: 400 }
            );
          } else if (loginResult.status === 200) {
            // 로그인 성공 시
            const resultData = await loginResult.json();
            logger.info("로그인 성공");
            return new Response(
              JSON.stringify({
                success: true,
                message: "로그인 성공",
                data: resultData,
              }),
              { status: 200 }
            );
          } else {
            // 기타 서버 내부 오류
            logger.error("로그인 실패 - 서버 오류");
            return new Response(
              JSON.stringify({
                success: false,
                message: "서버 내부 오류",
              }),
              { status: 500 }
            );
          }
        }
        // "register" 요청을 처리하는 부분
        if (param1 === "register") {
          // 로그 정보 기록: 회원가입 요청 처리 시작
          logger.info("회원가입 요청 처리 시작");
          // 요청 본문 데이터를 JSON 형식으로 파싱
          const registerData = await req.json();

          // 요청 본문을 RegisterRequestBody 형식으로 형변환
          const registerBody: RegisterRequestBody = registerData;

          // 사용자 회원가입 함수 호출
          const registerResult = await registerUser(registerBody);

          // 회원가입 결과 확인
          if (registerResult!.status === 401) {
            // 이메일 또는 검증 코드 누락
            logger.info("회원가입 실패 - 누락된 정보");
            return new Response(
              JSON.stringify({
                success: false,
                message: "이메일 또는 검증 코드 누락",
              }),
              { status: 401 }
            );
          } else if (registerResult!.status === 409) {
            // 이메일이 이미 사용 중
            logger.info("회원가입 실패 - 이메일 이미 사용 중");
            return new Response(
              JSON.stringify({
                success: false,
                message: "이메일이 이미 사용 중",
              }),
              { status: 409 }
            );
          } else if (registerResult!.status === 400) {
            // 검증 코드 무효 또는 만료
            logger.info("회원가입 실패 - 검증 코드 문제");
            return new Response(
              JSON.stringify({
                success: false,
                message: "검증 코드 무효 또는 만료",
              }),
              { status: 400 }
            );
          } else if (registerResult!.status === 200) {
            // 회원가입 성공
            const resultData = await registerResult!.json();
            logger.info("회원가입 성공");
            return new Response(
              JSON.stringify({
                success: true,
                message: "회원가입 성공",
                data: resultData,
              }),
              { status: 200 }
            );
          } else {
            // 서버 내부 오류
            logger.error("회원가입 처리 중 서버 오류 발생");
            return new Response(
              JSON.stringify({
                success: false,
                message: "서버 내부 오류",
              }),
              { status: 500 }
            );
          }
        }
        if (param1 === "code") {
          // 로그 정보 기록: 검증 코드 발송 요청 처리 시작
          logger.info("검증 코드 발송 요청 처리 시작");

          // 요청 본문 데이터를 JSON 형식으로 파싱
          const codeData = await req.json();

          // 요청 본문을 SendVerificationCodeRequestBody 형식으로 형변환
          const codeBody: SendVerificationCodeRequestBody = codeData;

          // 검증 코드 발송 함수 호출
          const codeResult = await sendVerificationCode(codeBody);

          // 검증 코드 발송 결과 확인
          if (codeResult!.status === 201) {
            // 새 사용자 생성 및 검증 코드 발송 성공 시
            const resultData = await codeResult!.json();
            logger.info("검증 코드 발송 성공");

            // 201 (Created) 상태 코드와 함께 검증 코드 발송 성공 응답 반환
            return new Response(
              JSON.stringify({
                success: true,
                message: "검증 코드 발송 성공",
                data: resultData,
              }),
              { status: 201 }
            );
          } else {
            // 검증 코드 이메일 발송 실패 시
            const resultData = await codeResult!.json();
            logger.info("검증 코드 발송 실패");

            // 적절한 상태 코드와 함께 검증 코드 발송 실패 응답 반환
            return new Response(
              JSON.stringify({
                success: false,
                message: "검증 코드 이메일 발송 실패",
                data: resultData,
              }),
              { status: codeResult!.status }
            );
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          // 예외 처리: 처리 중 오류 발생
          logger.error("처리 중 오류 발생: " + error.message);

          // 500 (Internal Server Error) 상태 코드와 함께 내부 서버 오류 응답 반환
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            {
              status: 500,
            }
          );
        }
      }
      break;

    // PUT 요청 처리
    case "PUT":
      try {
        if (param1 === "update") {
          // 로깅: 사용자 ID로 비활성화 요청 시작
          logger.info(`사용자 ID ${param2} 비활성화 요청 시작`);

          // 인증 토큰 확인
          if (!accessToken) {
            logger.error("인증 토큰 누락");
            return new Response(JSON.stringify({ error: "인증 없음" }), {
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

          // 사용자 ID의 유효성 검증
          const userId = token.id;
          if (!userId) {
            logger.error("사용자 ID 누락");
            return new Response(JSON.stringify({ error: "사용자 ID 누락" }), {
              status: 400,
            });
          }

          // 사용자 계정 비활성화 서비스 호출
          const disableUserResult = await disabledMemberAccount(userId);

          // 데이터베이스에서 해당 사용자 조회 및 비활성화 처리 결과 확인
          if (disableUserResult!.status === 404) {
            logger.error("해당 사용자를 찾을 수 없음");
            return new Response(
              JSON.stringify({ error: "사용자 찾을 수 없음" }),
              {
                status: 404,
              }
            );
          } else if (disableUserResult!.status === 409) {
            logger.error("계정이 이미 비활성화됨");
            return new Response(
              JSON.stringify({ error: "계정 이미 비활성화됨" }),
              {
                status: 409,
              }
            );
          } else if (disableUserResult!.status === 200) {
            logger.info("사용자 계정 비활성화 성공");
            return new Response(
              JSON.stringify({
                success: true,
                message: "사용자 계정 비활성화 성공",
              }),
              { status: 200 }
            );
          } else {
            logger.error("사용자 계정 비활성화 실패");
            return new Response(
              JSON.stringify({ error: "사용자 계정 비활성화 실패" }),
              { status: 500 }
            );
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`오류 발생: ${error.message}`);
          return new Response(
            JSON.stringify({
              error: "서버 내부 오류",
              message: error.message,
            }),
            { status: 500 }
          );
        }
      }
      break;

    // DELETE 요청 처리
    case "DELETE":
      try {
        if (param1 === "removeAccount") {
          // 로깅: 사용자 ID로 탈퇴 요청 시작
          logger.info(`사용자 ID ${param2} 탈퇴 요청 시작`);

          // 인증 토큰 확인
          if (!accessToken) {
            logger.error("인증 토큰 누락");
            return new Response(JSON.stringify({ error: "인증 없음" }), {
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
          const userId = token.id;

          // 사용자 ID의 유효성 검증
          if (!userId) {
            logger.error("사용자 ID 누락");
            return new Response(JSON.stringify({ error: "사용자 ID 누락" }), {
              status: 400,
            });
          }

          // 사용자 계정 탈퇴 서비스 호출
          const removeAccountResult = await removeMemberAccount(userId);
          logger.info("사용자 계정 탈퇴 서비스 요청 완료");

          // 사용자 계정 삭제 처리 결과 확인
          if (removeAccountResult!.status === 404) {
            logger.error("해당 사용자를 찾을 수 없음");
            return new Response(
              JSON.stringify({ error: "사용자 찾을 수 없음" }),
              {
                status: 404,
              }
            );
          } else if (removeAccountResult!.status === 200) {
            logger.info("사용자 계정 탈퇴 성공");
            return new Response(
              JSON.stringify({
                success: true,
                message: "사용자 계정 탈퇴 성공",
              }),
              { status: 200 }
            );
          } else {
            logger.error("사용자 계정 탈퇴 실패");
            return new Response(
              JSON.stringify({ error: "사용자 계정 탈퇴 실패" }),
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

    default:
      // 로그 정보 기록: 알 수 없는 요청
      logger.error(`알 수 없는 요청: ${method}`);

      // 400 (Bad Request) 상태 코드와 함께 알 수 없는 요청 응답 반환
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
      });
  }
};

export { handler as POST, handler as PUT, handler as DELETE };
