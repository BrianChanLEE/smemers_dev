import Logger from "@/src/middleware/logger";
import * as Membership_service from "@/src/_services/membershipService";
import { verifyJwt } from "@/src/lib/jwt";
import { Token } from "@/types/interface/Token_Interface";

const handler = async (req: any, context: any) => {
  console.log("context :", context);
  const { params } = context;
  const method = req.method;
  const param1 = params.param[0] as String;
  const param2 = params.param[1] as Number;
  const accessToken = req.headers.get("authorization");
  const logger = new Logger("logs");

  logger.info(`Membership API 요청: Method=${method}, Params=${param1}`);
  switch (method) {
    case "POST":
      try {
        // "create" 파라미터로 들어온 경우
        if (param1 === "create") {
          // 인증 토큰 검증
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
              }
            );
          }

          const token: Token = {
            id: jwtPayload.id,
            name: jwtPayload.name,
            email: jwtPayload.email,
            referral_code: jwtPayload.referral_code,
            role: jwtPayload.role,
          };

          const body = await req.json();

          // 멤버십 생성 서비스 호출
          const response = await Membership_service.createMembership(
            body,
            token
          );

          if (!response) {
            logger.error("Membership 생성 요청에 대한 응답이 없습니다.");
            return new Response(JSON.stringify({ error: "응답이 없습니다." }), {
              status: 500,
            });
          }

          const createMembershipResult = await response.json();

          if (!createMembershipResult || createMembershipResult.error) {
            logger.error("멤버십 생성 실패");
            return new Response(
              JSON.stringify({
                success: false,
                message: "멤버십 생성 실패",
                error: createMembershipResult.error,
              }),
              { status: createMembershipResult.status || 500 }
            );
          } else {
            logger.info("멤버십 생성 성공");
            return new Response(
              JSON.stringify({
                success: true,
                message: "멤버십 생성 성공",
                data: createMembershipResult,
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
            JSON.stringify({ error: "Internal server error" }),
            { status: 500 }
          );
        }
      }
      break;

    case "GET":
      try {
        if (param1 === "findAll") {
          // 모든 멤버십 조회 요청 처리
          const response = await Membership_service.getAllMembership();
          if (!response) {
            logger.error("MembershipList 요청에 대한 응답이 없습니다.");
            return new Response(JSON.stringify({ error: "응답이 없습니다." }), {
              status: 500,
            });
          }
          const findAll = await response.json();

          if (!findAll || findAll.length === 0) {
            // 조회된 멤버십이 없는 경우
            return new Response(
              JSON.stringify({
                success: false,
                message: "조회된 멤버십이 없습니다.",
              }),
              { status: 204 }
            );
          } else {
            // 조회된 멤버십이 있는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "모든 멤버십 조회에 성공했습니다.",
                data: findAll,
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
            JSON.stringify({ error: "Internal server error" }),
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

/************************************************************************************************************/

//    case "PUT":
//       try {
//         if (param1 === "useYn" && param2) {
//           if (!accessToken) {
//             logger.error("인증 토큰 누락");

//             // 인증 토큰이 없을 경우 401 (Unauthorized) 상태 코드 반환
//             return new Response(JSON.stringify({ error: "No Authorization" }), {
//               status: 401,
//             });
//           }

//           // 토큰 검증
//           const token = verifyJwt(accessToken);
//           if (!token || !token.id) {
//             logger.error("인증 토큰 검증 실패");

//             // 인증 토큰이 유효하지 않을 경우 401 (Unauthorized) 상태 코드 반환
//             return new Response(JSON.stringify({ error: "Invalid token" }), {
//               status: 401,
//             });
//           }
//           logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);

//           // BigInt로 변환
//           const Id = Number(param2);
//           // const body = await req.json(); // body 형식 검증 필요

//           // Store 업데이트 서비스 호출
//           const response = await updateMembershipUseYn(BigInt(Id), token, req);
//           const updateResult = await response!.json();

//           if (updateResult) {
//             // 업데이트 성공 시
//             return new Response(
//               JSON.stringify({
//                 success: true,
//                 message: "updateResult successful",
//                 data: updateResult,
//               }),
//               { status: 200 }
//             );
//           } else {
//             // 업데이트 실패 시
//             return new Response(
//               JSON.stringify({
//                 success: false,
//                 message: "updateResult failed",
//               }),
//               { status: 401 }
//             );
//           }
//         } else {
//           // 유효하지 않은 요청인 경우
//           return new Response(JSON.stringify({ error: "Invalid request" }), {
//             status: 400,
//           });
//         }
//       } catch (error) {
//         // 예외 발생 시 처리
//         if (error instanceof Error) {
//           console.error(error.message);

//           // 500 (Internal Server Error) 상태 코드 반환
//           return new Response(
//             JSON.stringify({ error: "Internal server error" }),
//             { status: 500 }
//           );
//         }
//       }
// break;

/************************************************************************************************************/
