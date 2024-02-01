import { number } from "./../../../../node_modules/@types/prop-types/index.d";
import Logger from "@/src/middleware/logger";
import {
  createStore,
  getStoreById,
  getAllStores,
  updateStore,
  deleteStore,
  getStoresWithinRadius,
  enabledStore,
} from "@/src/_services/storeService";
import { verifyJwt } from "@/src/lib/jwt";

const handler = async (req: any, context: any) => {
  console.log("context :", context);
  const { params } = context;
  const method = req.method;
  const param1 = params.param[0] as String;
  const param2 = params.param[1] as Number;
  const param3 = params.param[2] as Number;
  const param4 = params.param[3] as Number;
  const accessToken = req.headers.get("authorization");
  const logger = new Logger("logs");

  logger.info(`Store API 요청: Method=${method}, Params=${param1}`);
  switch (method) {
    case "POST":
      try {
        // "join" 파라미터로 들어온 경우
        if (param1 === "join") {
          // 인증 토큰이 누락된 경우
          if (!accessToken) {
            logger.error("인증 토큰 누락");

            // 401 (Unauthorized) 상태 코드를 반환하고 에러 메시지를 JSON으로 반환
            return new Response(JSON.stringify({ error: "인증 없음" }), {
              status: 401,
            });
          }

          // 토큰 검증
          const token = verifyJwt(accessToken);
          if (!token || !token.id) {
            logger.error("인증 토큰 검증 실패");

            // 유효하지 않은 토큰인 경우 401 (Unauthorized) 상태 코드 반환
            return new Response(
              JSON.stringify({ error: "유효하지 않은 토큰" }),
              {
                status: 401,
              }
            );
          }
          logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);

          // 요청 본문 파싱
          const body = await req.json();

          // 매장 서비스를 호출하여 매장 생성
          const response = await createStore(body, token.id);
          const createStoreResult = await response!.json();

          if (!createStoreResult || createStoreResult.error) {
            logger.error("매장 생성 실패");

            // 이미 존재하는 매장 이름인 경우
            if (createStoreResult.error === "Store already exists") {
              return new Response(
                JSON.stringify({
                  error: "이미 존재하는 매장 이름",
                }),
                { status: 409 }
              );
            }

            // 기타 오류인 경우
            return new Response(
              JSON.stringify({
                error: "매장 생성 실패",
              }),
              { status: 500 }
            );
          } else {
            logger.info("매장 생성 성공");

            // 매장 생성에 성공한 경우 201 (Created) 상태 코드 반환
            return new Response(
              JSON.stringify({
                success: true,
                message: "매장 생성 성공",
                data: createStoreResult,
              }),
              { status: 201 }
            );
          }
        }
      } catch (error) {
        // 예외 발생 시 처리
        if (error instanceof Error) {
          logger.error(`처리 중 예외 발생: ${error.message}`);
          console.error(error.message);

          // 500 (Internal Server Error) 상태 코드 반환
          return new Response(
            JSON.stringify({ error: "서버 내부 오류", message: error.message }),
            { status: 500 }
          );
        }
      }

    case "GET":
      try {
        if (param1 === "findAll") {
          // findAll 파라미터로 들어온 경우

          // 모든 매장 서비스를 호출하여 모든 매장 조회
          const response = await getAllStores();
          const findAll = await response!.json();

          if (!findAll || findAll.length === 0) {
            // 조회된 데이터가 없는 경우
            return new Response(
              JSON.stringify({
                error: "매장이 존재하지 않음",
              }),
              { status: 404 }
            );
          } else {
            // 조회된 데이터가 있는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "모든 매장 조회 성공",
                data: findAll,
              }),
              { status: 200 }
            );
          }
        }
        if (param1 === "findOne" && param2) {
          // findOne 파라미터로 들어온 경우

          // 인증 토큰 누락 확인
          if (!accessToken) {
            logger.error("인증 토큰 누락");

            // 인증 토큰이 없을 경우 401 (Unauthorized) 상태 코드 반환
            return new Response(JSON.stringify({ error: "인증 없음" }), {
              status: 401,
            });
          }

          // 토큰 검증
          const token = verifyJwt(accessToken);

          if (!token || !token.id) {
            logger.error("인증 토큰 검증 실패");

            // 인증 토큰이 유효하지 않을 경우 401 (Unauthorized) 상태 코드 반환
            return new Response(
              JSON.stringify({ error: "유효하지 않은 토큰" }),
              {
                status: 401,
              }
            );
          }
          logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);

          // 매장 ID의 유효성 검증
          const id = Number(param2);
          if (isNaN(id)) {
            return new Response(JSON.stringify({ error: "유효하지 않은 ID" }), {
              status: 400,
            });
          }

          // 매장 서비스를 호출하여 특정 매장 조회
          const response = await getStoreById(BigInt(id));
          const findOne = await response!.json();
          if (!findOne) {
            // 조회된 데이터가 없는 경우
            return new Response(
              JSON.stringify({
                error: "매장 찾을 수 없음",
              }),
              { status: 404 }
            );
          } else {
            // 조회된 데이터가 있는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "매장 조회 성공",
                data: findOne,
              }),
              { status: 200 }
            );
          }
        }
        if (param1 === "map" && param2 && param3 && param4) {
          // 인증 토큰 누락 확인
          if (!accessToken) {
            logger.error("인증 토큰 누락");

            // 인증 토큰이 없을 경우 401 (Unauthorized) 상태 코드 반환
            return new Response(JSON.stringify({ error: "인증 없음" }), {
              status: 401,
            });
          }

          // 토큰 검증
          const token = verifyJwt(accessToken);
          if (!token || !token.id) {
            logger.error("인증 토큰 검증 실패");

            // 인증 토큰이 유효하지 않을 경우 401 (Unauthorized) 상태 코드 반환
            return new Response(
              JSON.stringify({ error: "유효하지 않은 토큰" }),
              {
                status: 401,
              }
            );
          }
          logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);

          // 좌표 및 반경 값 파싱
          const lat = Number(param2);
          const lng = Number(param3);
          const radius = Number(param4);

          // 서비스를 호출하여 지정된 반경 내의 Store 조회
          const response = await getStoresWithinRadius(lat, lng, radius);
          const storesWithinRadius = await response!.json();

          if (!storesWithinRadius || storesWithinRadius.length === 0) {
            // 조회된 데이터가 없는 경우
            return new Response(
              JSON.stringify({
                success: false,
                message: "반경 내 매장 없음",
              }),
              { status: 404 }
            );
          } else {
            // 조회된 데이터가 있는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "반경 내 매장 조회 성공",
                data: storesWithinRadius,
              }),
              { status: 200 }
            );
          }
        }
      } catch (error) {
        // 예외 발생 시 처리
        if (error instanceof Error) {
          console.error(error.message);

          // 500 (Internal Server Error) 상태 코드 반환
          return new Response(
            JSON.stringify({ error: "서버 내부 오류", message: error.message }),
            { status: 500 }
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

          const id = param2;
          if (!id) {
            return new Response(JSON.stringify({ error: "유효하지 않은 ID" }), {
              status: 400,
            });
          }

          // 매장 활성화 상태 업데이트 서비스 호출
          const response = await enabledStore(Number(id));
          const updateResult = await response!.json();

          if (updateResult) {
            // 업데이트 성공 시
            return new Response(
              JSON.stringify({
                success: true,
                message: "매장 활성화 업데이트 성공",
                data: updateResult,
              }),
              { status: 200 }
            );
          } else {
            // 업데이트 실패 시
            return new Response(
              JSON.stringify({
                success: false,
                message: "매장 활성화 업데이트 실패",
                error: updateResult.error,
              }),
              { status: updateResult.status || 500 }
            );
          }
        }
        if (param1 === "update" && param2) {
          // 인증 토큰 검증
          if (!accessToken || !verifyJwt(accessToken)) {
            return new Response(JSON.stringify({ error: "No Authorization" }), {
              status: 401,
            });
          }

          // ID를 BigInt로 변환
          const id = Number(param2);
          if (!id) {
            return new Response(JSON.stringify({ error: "Invalid ID" }), {
              status: 400,
            });
          }

          // 요청 본문 파싱
          const body = await req.json(); // body 형식 검증 필요

          // Store 업데이트 서비스 호출
          const response = await updateStore(Number(id), body);
          const updateResult = await response!.json();

          if (updateResult) {
            // 업데이트 성공 시
            return new Response(
              JSON.stringify({
                success: true,
                message: "updateResult successful",
                data: updateResult,
              }),
              { status: 200 }
            );
          } else {
            // 업데이트 실패 시
            return new Response(
              JSON.stringify({
                success: false,
                message: "createStoreResult failed",
              }),
              { status: 401 }
            );
          }
        } else {
          // 유효하지 않은 요청인 경우
          return new Response(JSON.stringify({ error: "Invalid request" }), {
            status: 400,
          });
        }
      } catch (error) {
        // 예외 발생 시 처리
        if (error instanceof Error) {
          console.error(error.message);

          // 500 (Internal Server Error) 상태 코드 반환
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500 }
          );
        }
      }
      break;

    case "DELETE":
      try {
        if (param1 === "delete") {
          // 인증 토큰 검증
          if (!accessToken || !verifyJwt(accessToken)) {
            return new Response(JSON.stringify({ error: "인증 없음" }), {
              status: 401,
            });
          }

          // 토큰 검증
          const token = verifyJwt(accessToken);
          if (!token || !token.id) {
            return new Response(
              JSON.stringify({ error: "유효하지 않은 토큰" }),
              {
                status: 401,
              }
            );
          }
          logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);

          // ID를 숫자로 변환
          const id = Number(param2);
          if (!id) {
            return new Response(JSON.stringify({ error: "유효하지 않은 ID" }), {
              status: 400,
            });
          }

          // 매장 삭제 서비스 호출
          const response = await deleteStore(BigInt(id));
          const deleteResult = await response!.json();

          if (!deleteResult || deleteResult.error) {
            // 삭제 실패 시
            return new Response(
              JSON.stringify({
                success: false,
                message: "매장 삭제 실패",
                error: deleteResult.error,
              }),
              { status: deleteResult.status || 500 }
            );
          } else {
            // 삭제 성공 시
            return new Response(
              JSON.stringify({
                success: true,
                message: "매장 삭제 성공",
                data: deleteResult,
              }),
              { status: 200 }
            );
          }
        }
      } catch (error) {
        // 예외 발생 시 처리
        if (error instanceof Error) {
          console.error(error.message);

          // 500 (Internal Server Error) 상태 코드 반환
          return new Response(
            JSON.stringify({ error: "서버 내부 오류", message: error.message }),
            { status: 500 }
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
