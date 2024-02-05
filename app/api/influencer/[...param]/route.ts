import Logger from "@/src/middleware/logger";
import {
  createInfluencer,
  getInfluencerById,
  getAllInfluencer,
  updateInfluencer,
  enabledInfluencer,
  deleteInfluencer,
} from "@/src/_services/influencerServcice";
import { Token } from "@/types/interface/Token_Interface";
import { verifyJwt } from "@/src/lib/jwt";

const handler = async (req: any, context: any) => {
  console.log("context :", context);
  const { params } = context;
  const method = req.method;
  const param1 = params.param[0] as String;
  const param2 = params.param[1] as Number;
  const accessToken = req.headers.get("authorization");
  const logger = new Logger("logs");

  logger.info(`influencer API 요청: Method=${method}, Params=${param1}`);
  switch (method) {
    case "POST":
      try {
        if (param1 === "join") {
          // 인증 토큰이 누락된 경우
          if (!accessToken) {
            logger.error("인증 토큰 누락");
            return new Response(JSON.stringify({ error: "인증 없음" }), {
              status: 401,
            });
          }
          const jwtPayload = verifyJwt(accessToken);
          if (!jwtPayload || !jwtPayload.id) {
            logger.error("인증 토큰 검증 실패");
            return new Response(
              JSON.stringify({ error: "유효하지 않은 토큰" }),
              {
                status: 401,
              },
            );
          }

          const token: Token = {
            id: jwtPayload.id,
            name: jwtPayload.name,
            email: jwtPayload.email,
            referral_code: jwtPayload.referral_code,
            role: jwtPayload.role,
          };
          console.log("token:", token);
          const body = await req.json();
          // 인플루언서 계정 생성 서비스 호출
          const response = await createInfluencer(body, token);
          const createInfluencerResult = await response!.json();

          if (createInfluencerResult.error) {
            logger.error("인플루언서 계정 생성 실패");
            return new Response(
              JSON.stringify({
                success: false,
                message: "인플루언서 계정 생성 실패",
                error: createInfluencerResult.error,
              }),
              { status: createInfluencerResult.status || 500 },
            );
          } else {
            logger.info("인플루언서 계정 생성 성공");
            return new Response(
              JSON.stringify({
                success: true,
                message: "인플루언서 계정 생성 성공",
                data: createInfluencerResult,
              }),
              { status: 201 },
            );
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`처리 중 예외 발생: ${error.message}`);
          return new Response(
            JSON.stringify({ error: "서버 내부 오류", message: error.message }),
            { status: 500 },
          );
        }
      }
      break;

    case "GET":
      try {
        if (param1 === "findAll") {
          // 모든 인플루언서 조회 서비스 호출
          const response = await getAllInfluencer();
          const findAll = await response!.json();

          if (!findAll || findAll.length === 0) {
            // 조회된 데이터가 없는 경우
            return new Response(
              JSON.stringify({
                success: false,
                message: "인플루언서가 존재하지 않음",
              }),
              { status: 404 },
            );
          } else {
            // 조회된 데이터가 있는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "모든 인플루언서 조회 성공",
                data: findAll,
              }),
              { status: 200 },
            );
          }
        } else if (param1 === "findOne" && param2) {
          // 인증 토큰 누락 확인
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
              },
            );
          }
          logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);

          // ID를 Number로 변환
          const id = Number(param2);
          if (!id) {
            return new Response(JSON.stringify({ error: "유효하지 않은 ID" }), {
              status: 400,
            });
          }

          // 인플루언서 조회 서비스 호출
          const response = await getInfluencerById(BigInt(id));
          const findOne = await response!.json();

          if (!findOne) {
            // 조회된 데이터가 없는 경우
            return new Response(
              JSON.stringify({
                success: false,
                message: "인플루언서 찾을 수 없음",
              }),
              { status: 404 },
            );
          } else {
            // 조회된 데이터가 있는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "인플루언서 조회 성공",
                data: findOne,
              }),
              { status: 200 },
            );
          }
        }
      } catch (error) {
        // 예외 발생 시 처리
        if (error instanceof Error) {
          console.error(error.message);
          return new Response(
            JSON.stringify({ error: "서버 내부 오류", message: error.message }),
            { status: 500 },
          );
        }
      }
      break;

    case "PUT":
      try {
        if (param1 === "enabled" && param2) {
          // 인증 토큰 검증
          if (!accessToken || !verifyJwt(accessToken)) {
            return new Response(JSON.stringify({ error: "인증 없음" }), {
              status: 401,
            });
          }

          // ID를 숫자로 변환
          const id = Number(param2);
          if (!id) {
            return new Response(JSON.stringify({ error: "유효하지 않은 ID" }), {
              status: 400,
            });
          }
          // console.log("id :", id);
          // 인플루언서 활성화 상태 변경 서비스 호출
          const response = await enabledInfluencer(id);
          const updateResult = await response!.json();

          if (updateResult) {
            // 업데이트 성공 시
            return new Response(
              JSON.stringify({
                success: true,
                message: "인플루언서 활성화 상태 변경 성공",
                data: updateResult,
              }),
              { status: 200 },
            );
          } else {
            // 업데이트 실패 시
            return new Response(
              JSON.stringify({
                success: false,
                message: "인플루언서 활성화 상태 변경 실패",
                error: updateResult.error,
              }),
              { status: updateResult.status || 500 },
            );
          }
        }
        if (param1 === "update" && param2) {
          // 인증 토큰 검증
          if (!accessToken || !verifyJwt(accessToken)) {
            return new Response(JSON.stringify({ error: "인증 없음" }), {
              status: 401,
            });
          }

          // ID를 Number로 변환
          const id = Number(param2);
          if (!id) {
            return new Response(JSON.stringify({ error: "유효하지 않은 ID" }), {
              status: 400,
            });
          }

          // 요청 본문 파싱
          const body = await req.json(); // body 형식 검증 필요

          // 인플루언서 정보 업데이트 서비스 호출
          const response = await updateInfluencer(id, body);
          const updateResult = await response!.json();

          if (updateResult) {
            // 업데이트 성공 시
            return new Response(
              JSON.stringify({
                success: true,
                message: "인플루언서 정보 업데이트 성공",
                data: updateResult,
              }),
              { status: 200 },
            );
          } else {
            // 업데이트 실패 시
            return new Response(
              JSON.stringify({
                success: false,
                message: "인플루언서 정보 업데이트 실패",
                error: updateResult.error,
              }),
              { status: updateResult.status || 500 },
            );
          }
        }
      } catch (error) {
        // 예외 발생 시 처리
        if (error instanceof Error) {
          console.error(error.message);
          return new Response(
            JSON.stringify({ error: "서버 내부 오류", message: error.message }),
            { status: 500 },
          );
        }
      }
      break;

    case "DELETE":
      try {
        if (param1 === "delete" && param2) {
          // 인증 토큰 검증
          if (!accessToken || !verifyJwt(accessToken)) {
            return new Response(JSON.stringify({ error: "인증 없음" }), {
              status: 401,
            });
          }
          console.log("xxx");
          // 토큰 검증
          const token = verifyJwt(accessToken);
          if (!token || !token.id) {
            return new Response(
              JSON.stringify({ error: "유효하지 않은 토큰" }),
              {
                status: 401,
              },
            );
          }
          logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);

          // ID를 숫자로 변환
          const id = param2;
          if (!id) {
            return new Response(JSON.stringify({ error: "유효하지 않은 ID" }), {
              status: 400,
            });
          }

          // 인플루언서 삭제 서비스 호출
          const response = await deleteInfluencer(Number(id));
          const deleteResult = await response!.json();

          if (deleteResult) {
            // 삭제 성공 시
            return new Response(
              JSON.stringify({
                success: true,
                message: "인플루언서 계정 삭제 성공",
                data: deleteResult,
              }),
              { status: 200 },
            );
          } else {
            // 삭제 실패 시
            return new Response(
              JSON.stringify({
                success: false,
                message: "인플루언서 계정 삭제 실패",
                error: deleteResult.error,
              }),
              { status: deleteResult.status || 500 },
            );
          }
        }
      } catch (error) {
        // 예외 발생 시 처리
        if (error instanceof Error) {
          console.error(error.message);
          return new Response(
            JSON.stringify({ error: "서버 내부 오류", message: error.message }),
            { status: 500 },
          );
        }
      }
      break;

    default:
      console.log("지원되지 않는 메서드:", method);
      return new Response(JSON.stringify({ error: "지원되지 않는 메서드" }), {
        status: 405,
      });
  }
};
export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
