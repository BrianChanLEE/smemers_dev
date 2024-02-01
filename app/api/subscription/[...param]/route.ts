import Logger from "@/src/middleware/logger";
import * as Subscription_Service from "@/src/_services/subscriptionService";
import {
  SubStoreRequest,
  SubInfluencerRequest,
  SubMembershipRequest,
} from "@/types/interface/subscription_Interface";
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

  logger.info(`Subscription API 요청: Method=${method}, Params=${param1}`);
  switch (method) {
    case "POST":
      try {
        // "Influencer" 파라미터로 들어온 경우
        if (param1 === "Influencer") {
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
              { status: 401 }
            );
          }

          const token: Token = {
            id: jwtPayload.id,
            name: jwtPayload.name,
            email: jwtPayload.email,
            referral_code: jwtPayload.referral_code,
            role: jwtPayload.role,
          };

          // 요청 본문 파싱
          const body = await req.json();

          // 인플루언서 구독 서비스 호출
          const response = await Subscription_Service.subInfluencer(
            body,
            token
          );
          const subInfluencerResult = await response!.json();

          if (!subInfluencerResult) {
            // 구독 실패 또는 오류 발생
            logger.error("구독 실패");
            return new Response(
              JSON.stringify({
                success: false,
                message: "구독 실패",
                error: subInfluencerResult.error,
              }),
              { status: subInfluencerResult.status || 500 }
            );
          } else if (subInfluencerResult.alreadySubscribed) {
            // 이미 구독 중인 경우
            logger.info("이미 구독 중, 구독 취소 처리");
            return new Response(
              JSON.stringify({
                success: true,
                message: "구독 취소 처리됨",
                data: subInfluencerResult,
              }),
              { status: 200 }
            );
          } else {
            // 새로운 구독 생성 성공
            logger.info("구독 생성 성공");
            return new Response(
              JSON.stringify({
                success: true,
                message: "구독 생성 성공",
                data: subInfluencerResult,
              }),
              { status: 201 }
            );
          }
        }
        // "Store" 파라미터로 들어온 경우
        if (param1 === "Store") {
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
              { status: 401 }
            );
          }

          const token: Token = {
            id: jwtPayload.id,
            name: jwtPayload.name,
            email: jwtPayload.email,
            referral_code: jwtPayload.referral_code,
            role: jwtPayload.role,
          };

          // 요청 본문 파싱
          const body = await req.json();

          // 공지사항 서비스를 호출하여 Store 생성
          const response = await Subscription_Service.subStore(body, token.id);
          const subStoreResult = await response!.json();

          if (!subStoreResult) {
            // 구독 실패 또는 오류 발생
            logger.error("구독 실패");
            return new Response(
              JSON.stringify({
                success: false,
                message: "구독 실패",
                error: subStoreResult.error,
              }),
              { status: subStoreResult.status || 500 }
            );
          } else if (subStoreResult.alreadySubscribed) {
            // 이미 구독 중인 경우
            logger.info("이미 구독 중, 구독 취소 처리");
            return new Response(
              JSON.stringify({
                success: true,
                message: "구독 취소 처리됨",
                data: subStoreResult,
              }),
              { status: 200 }
            );
          } else {
            // 새로운 구독 생성 성공
            logger.info("구독 생성 성공");
            return new Response(
              JSON.stringify({
                success: true,
                message: "구독 생성 성공",
                data: subStoreResult,
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
    case "GET":
      try {
        if (param1 === "findAll") {
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

          // 스토어 구독 목록 서비스 호출
          const response = await Subscription_Service.getSubscriptionList(
            token
          );
          const findAll = await response!.json();

          if (!findAll) {
            // 구독 목록이 없는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "구독한 스토어나 인플루언서가 없습니다.",
              }),
              { status: 200 }
            );
          } else {
            // 구독 목록이 있는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "구독 목록 조회 성공",
                data: findAll,
              }),
              { status: 200 }
            );
          }
        }

        if (param1 === "findListForInf") {
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

          // 인플루언서 구독 목록 서비스 호출
          const response = await Subscription_Service.getSubListForInfluencer(
            token
          );
          const data = await response!.json();

          if (!data) {
            // 구독한 인플루언서가 없는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "구독한 인플루언서가 없습니다.",
              }),
              { status: 204 }
            );
          } else {
            // 구독 목록이 있는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "구독 목록 조회 성공",
                data: data,
              }),
              { status: 200 }
            );
          }
        }

        if (param1 === "findListForStore") {
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
              { status: 401 }
            );
          }

          const token: Token = {
            id: jwtPayload.id,
            name: jwtPayload.name,
            email: jwtPayload.email,
            referral_code: jwtPayload.referral_code,
            role: jwtPayload.role,
          };
          //  서비스를 호출하여 모든 스토어 리스트 조회
          const response = await Subscription_Service.getSubListForStore(token);

          if (!response || !response.ok) {
            logger.error("서비스 응답 없음 또는 오류 발생");
            return new Response(
              JSON.stringify({ error: "Service unavailable" }),
              {
                status: 503,
              }
            );
          }
          const findAll = await response.json();

          if (!findAll || findAll.length === 0) {
            // 조회된 데이터가 없는 경우
            return new Response(
              JSON.stringify({
                success: false,
                message: "No content",
              }),
              { status: 204 }
            );
          } else {
            // 조회된 데이터가 있는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "findAll successful",
                data: findAll,
              }),
              { status: 201 }
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

export { handler as GET, handler as POST };

/************************************************************************************************************/

//   case "PUT":
//       try {
//         if (param1 === "deactivateInfluencer" && param2) {
//           // 인증 토큰이 누락된 경우
//           if (!accessToken) {
//             logger.error("인증 토큰 누락");

//             // 401 (Unauthorized) 상태 코드를 반환하고 에러 메시지를 JSON으로 반환
//             return new Response(JSON.stringify({ error: "No Authorization" }), {
//               status: 401,
//             });
//           }

//           // 토큰 검증
//           const token = verifyJwt(accessToken);
//           if (!token || !token.id) {
//             logger.error("인증 토큰 검증 실패");

//             // 유효하지 않은 토큰인 경우 401 (Unauthorized) 상태 코드 반환
//             return new Response(JSON.stringify({ error: "Invalid token" }), {
//               status: 401,
//             });
//           }
//           logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);

//           const influencer_Id = Number(param2);
//           const body = await req.param2;

//           if (!influencer_Id) {
//             return new Response(JSON.stringify({ error: "Invalid ID" }), {
//               status: 400,
//             });
//           }

//           const subInfluencerRequest: SubInfluencerRequest = {
//             user_Id: token.id,
//             influencer_Id: influencer_Id,
//             influencer_deactivate: true,
//           };

//           // Store 업데이트 서비스 호출
//           const response = await updateInfluencerSubscription(
//             subInfluencerRequest,
//             token.id,
//             body
//           );
//           const deactivateResult = await response!.json();

//           if (deactivateResult) {
//             // 업데이트 성공 시
//             return new Response(
//               JSON.stringify({
//                 success: true,
//                 message: "구독 취소하셨습니다.",
//                 data: deactivateResult,
//               }),
//               { status: 200 }
//             );
//           } else {
//             // 업데이트 실패 시
//             return new Response(
//               JSON.stringify({
//                 success: false,
//                 message: "deactivateResult failed",
//               }),
//               { status: 401 }
//             );
//           }
//         }
//         if (param1 === "deactivateStore" && param2) {
//           // 인증 토큰이 누락된 경우
//           if (!accessToken) {
//             logger.error("인증 토큰 누락");

//             // 401 (Unauthorized) 상태 코드를 반환하고 에러 메시지를 JSON으로 반환
//             return new Response(JSON.stringify({ error: "No Authorization" }), {
//               status: 401,
//             });
//           }

//           // 토큰 검증
//           const token = verifyJwt(accessToken);
//           if (!token || !token.id) {
//             logger.error("인증 토큰 검증 실패");

//             // 유효하지 않은 토큰인 경우 401 (Unauthorized) 상태 코드 반환
//             return new Response(JSON.stringify({ error: "Invalid token" }), {
//               status: 401,
//             });
//           }
//           logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);

//           const store_Id = Number(param2);
//           const body = await req.param2;

//           if (!store_Id) {
//             return new Response(JSON.stringify({ error: "Invalid ID" }), {
//               status: 400,
//             });
//           }

//           const subStoreRequest: SubStoreRequest = {
//             user_Id: token.id,
//             store_Id: store_Id,
//             store_deactivate: true,
//           };
//           // Store 업데이트 서비스 호출
//           const response = await updateStoreSubscription(
//             subStoreRequest,
//             token.id,
//             body
//           );
//           const deactivateResult = await response!.json();

//           if (deactivateResult) {
//             // 업데이트 성공 시
//             return new Response(
//               JSON.stringify({
//                 success: true,
//                 message: "구독 취소하셨습니다.",
//                 data: deactivateResult,
//               }),
//               { status: 200 }
//             );
//           } else {
//             // 업데이트 실패 시
//             return new Response(
//               JSON.stringify({
//                 success: false,
//                 message: "deactivateResult failed",
//               }),
//               { status: 401 }
//             );
//           }
//         }
//         if (param1 === "deactivateMembership" && param2) {
//           // 인증 토큰이 누락된 경우
//           if (!accessToken) {
//             logger.error("인증 토큰 누락");

//             // 401 (Unauthorized) 상태 코드를 반환하고 에러 메시지를 JSON으로 반환
//             return new Response(JSON.stringify({ error: "No Authorization" }), {
//               status: 401,
//             });
//           }

//           // 토큰 검증
//           const token = verifyJwt(accessToken);
//           if (!token || !token.id) {
//             logger.error("인증 토큰 검증 실패");

//             // 유효하지 않은 토큰인 경우 401 (Unauthorized) 상태 코드 반환
//             return new Response(JSON.stringify({ error: "Invalid token" }), {
//               status: 401,
//             });
//           }
//           logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);

//           const membership_Id = Number(param2);
//           const body = await req.param2;

//           if (!membership_Id) {
//             return new Response(JSON.stringify({ error: "Invalid ID" }), {
//               status: 400,
//             });
//           }

//           const subMembershipRequest: SubMembershipRequest = {
//             user_Id: token.id,
//             membership_Id: body.membership_Id,
//             membership_deactivate: true,
//           };
//           // Store 업데이트 서비스 호출
//           const response = await updateMembershipSubscription(
//             subMembershipRequest,
//             token.id,
//             body
//           );

//           const deactivateResult = await response!.json();

//           if (deactivateResult) {
//             // 업데이트 성공 시
//             return new Response(
//               JSON.stringify({
//                 success: true,
//                 message: "구독 취소하셨습니다.",
//                 data: deactivateResult,
//               }),
//               { status: 200 }
//             );
//           } else {
//             // 업데이트 실패 시
//             return new Response(
//               JSON.stringify({
//                 success: false,
//                 message: "deactivateResult failed",
//               }),
//               { status: 401 }
//             );
//           }
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
