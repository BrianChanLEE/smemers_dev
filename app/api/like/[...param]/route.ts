import * as likeService from "@/src/_services/likeServices";
import Logger from "@/src/middleware/logger";
import { verifyJwt } from "@/src/lib/jwt";
import { Token } from "@/types/interface/Token_Interface";
import {
  RemoveStoreLikeRequest,
  RemoveInfluencerLikeRequest,
  RemoveNoticeLikeRequest,
} from "@/types/interface/like_Interface";

const handler = async (req: any, context: any) => {
  console.log("context :", context);
  const { params } = context;
  const method = req.method;
  const param1 = params.param[0] as String;
  const param2 = params.param[1] as Number;
  const accessToken = req.headers.get("authorization");

  const logger = new Logger("logs");
  logger.info(`요청 시작: ${method} ${param1} ${param2}`);
  switch (req.method) {
    case "POST":
      try {
        if (param1 === "likeNotice") {
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
              },
            );
          }

          const token = {
            id: jwtPayload.id,
            name: jwtPayload.name,
            email: jwtPayload.email,
            referral_code: jwtPayload.referral_code,
            role: jwtPayload.role,
          };

          // 좋아요 요청 본문 파싱
          const body = await req.json();
          logger.info("좋아요 요청 본문 파싱 완료");

          // 공지사항에 대한 좋아요 서비스 호출
          const response = await likeService.createLikeNotice(body, token);
          const createLikeNoticeResult = await response!.json();
          logger.info("좋아요 서비스 요청 완료");

          if (!createLikeNoticeResult || createLikeNoticeResult.error) {
            // 좋아요 생성 실패
            logger.error("좋아요 요청 실패");
            return new Response(
              JSON.stringify({
                success: false,
                message: "좋아요 생성 실패",
                error: createLikeNoticeResult.error,
              }),
              { status: createLikeNoticeResult.status || 500 },
            );
          } else if (createLikeNoticeResult.alreadyExists) {
            // 이미 좋아요가 존재하는 경우
            logger.info("좋아요 이미 존재함");
            return new Response(
              JSON.stringify({
                success: false,
                message: "좋아요 이미 존재함",
                data: createLikeNoticeResult,
              }),
              { status: 200 }, // 이미 좋아요가 있으면 좋아요 제거 후 200 반환
            );
          } else {
            // 좋아요 생성 성공
            logger.info("좋아요 제거 요청 성공");
            return new Response(
              JSON.stringify({
                success: true,
                data: createLikeNoticeResult,
              }),
              { status: 201 }, // 새로운 좋아요 생성 후 201 반환
            );
          }
        }
        if (param1 === "likeMembership") {
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

          // 좋아요 요청 본문 파싱
          const body = await req.json();
          logger.info("좋아요 요청 본문 파싱 완료");
          console.log("body :", body);
          // 공지사항에 대한 좋아요 서비스 호출
          const response = await likeService.CreateLikeMembership(body, token);
          const createLikeMembershipResult = await response!.json();
          logger.info("좋아요 서비스 요청 완료");

          if (!createLikeMembershipResult || createLikeMembershipResult.error) {
            // 좋아요 생성 실패
            logger.error("좋아요 요청 실패");
            return new Response(
              JSON.stringify({
                success: false,
                message: "좋아요 생성 실패",
                error: createLikeMembershipResult.error,
              }),
              { status: createLikeMembershipResult.status || 500 },
            );
          } else if (createLikeMembershipResult.alreadyExists) {
            // 이미 좋아요가 존재하는 경우
            logger.info("좋아요 이미 존재함");
            return new Response(
              JSON.stringify({
                success: false,
                message: "좋아요 이미 존재함",
                data: createLikeMembershipResult,
              }),
              { status: 200 }, // 이미 좋아요가 있으면 좋아요 제거 후 200 반환
            );
          } else {
            // 좋아요 생성 성공
            logger.info("좋아요 제거 요청 성공");
            return new Response(
              JSON.stringify({
                success: true,
                data: createLikeMembershipResult,
              }),
              { status: 201 }, // 새로운 좋아요 생성 후 201 반환
            );
          }
        }
        // (다른 'param1' 값에 대한 처리 부분 추가)

        // (다른 'param1' 값에 대한 처리 부분 추가)
        if (param1 === "likeInfluencer") {
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

          // 좋아요 요청 본문 파싱
          const body = await req.json();
          logger.info("좋아요 요청 본문 파싱 완료");

          // 인플루언서에 대한 좋아요 서비스 호출
          const response = await likeService.createLikeInfluencer(body, token);
          const createLikeInfluencerResult = await response!.json();
          logger.info("좋아요 서비스 요청 완료");

          if (!createLikeInfluencerResult || createLikeInfluencerResult.error) {
            // 좋아요 생성 실패
            logger.error("좋아요 요청 실패");
            return new Response(
              JSON.stringify({
                success: false,
                message: "좋아요 생성 실패",
                error: createLikeInfluencerResult.error,
              }),
              { status: createLikeInfluencerResult.status || 500 },
            );
          } else if (createLikeInfluencerResult.alreadyExists) {
            // 이미 좋아요가 존재하는 경우
            logger.info("좋아요 이미 존재함");
            return new Response(
              JSON.stringify({
                success: false,
                message: "좋아요 이미 존재함",
                data: createLikeInfluencerResult,
              }),
              { status: 200 }, // 이미 좋아요가 있으면 좋아요 제거 후 200 반환
            );
          } else {
            // 좋아요 생성 성공
            logger.info("좋아요 제거 요청 성공");
            return new Response(
              JSON.stringify({
                success: true,
                data: createLikeInfluencerResult,
              }),
              { status: 201 }, // 새로운 좋아요 생성 후 201 반환
            );
          }
        }
        // (다른 'param1' 값에 대한 처리 부분 추가)

        if (param1 === "likeStore") {
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

          logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);

          // 좋아요 요청 본문 파싱
          const body = await req.json();
          logger.info("좋아요 요청 본문 파싱 완료");

          // 상점에 대한 좋아요 서비스 호출
          const response = await likeService.createLikeStore(body, token);
          const createLikeStoreResult = await response?.json();
          logger.info("좋아요 서비스 요청 완료");

          if (!createLikeStoreResult || createLikeStoreResult.error) {
            // 좋아요 생성 실패
            logger.error("좋아요 요청 실패");
            return new Response(
              JSON.stringify({
                success: false,
                message: "좋아요 생성 실패",
                error: createLikeStoreResult.error,
              }),
              { status: createLikeStoreResult.status || 500 },
            );
          } else if (createLikeStoreResult.alreadyExists) {
            // 이미 좋아요가 존재하는 경우
            logger.info("좋아요 이미 존재함");
            return new Response(
              JSON.stringify({
                success: false,
                message: "좋아요 이미 존재함",
                data: createLikeStoreResult,
              }),
              { status: 200 }, // 이미 좋아요가 있으면 좋아요 제거 후 200 반환
            );
          } else {
            // 좋아요 생성 성공
            logger.info("좋아요 제거 요청 성공");
            return new Response(
              JSON.stringify({
                success: true,
                data: createLikeStoreResult,
              }),
              { status: 201 }, // 새로운 좋아요 생성 후 201 반환
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
        if (param1 === "likeNoticeList") {
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

          logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);
          const response = await likeService.getLikeListForNotice(token);
          const getLikeNoticeListResult = await response!.json();

          if (!getLikeNoticeListResult) {
            logger.error("리스트 요청 실패");
            return new Response(
              JSON.stringify({
                success: false,
                message: "리스트 요청 실패",
                error: getLikeNoticeListResult.error,
              }),
              { status: getLikeNoticeListResult.status || 500 },
            );
          } else if (getLikeNoticeListResult.length === 0) {
            // 좋아요 누른 공지사항이 없는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "좋아한 공지사항이 없습니다.",
              }),
              { status: 204 },
            );
          } else {
            // 좋아요 누른 공지사항 목록 조회 성공
            return new Response(
              JSON.stringify({
                success: true,
                message: "좋아요 목록 조회 성공",
                data: getLikeNoticeListResult,
              }),
              { status: 200 },
            );
          }
        }
        if (param1 === "likeInfluencerList") {
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
              { status: 401 },
            );
          }

          const token: Token = {
            id: jwtPayload.id,
            name: jwtPayload.name,
            email: jwtPayload.email,
            referral_code: jwtPayload.referral_code,
            role: jwtPayload.role,
          };

          logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);
          const response = await likeService.getLikeListForInfluencer(token);
          const getLikeListForInfluencerResult = await response!.json();

          if (!getLikeListForInfluencerResult) {
            logger.error("리스트 요청 실패");
            return new Response(
              JSON.stringify({
                success: false,
                message: "리스트 요청 실패",
                error: getLikeListForInfluencerResult.error,
              }),
              { status: getLikeListForInfluencerResult.status || 500 },
            );
          } else if (getLikeListForInfluencerResult.length === 0) {
            // 좋아요 누른 인플루언서가 없는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "좋아한 인플루언서가 없습니다.",
              }),
              { status: 204 },
            );
          } else {
            // 좋아요 누른 인플루언서 목록 조회 성공
            return new Response(
              JSON.stringify({
                success: true,
                message: "좋아요 목록 조회 성공",
                data: getLikeListForInfluencerResult,
              }),
              { status: 200 },
            );
          }
        }
        if (param1 === "likeStoreList") {
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
              { status: 401 },
            );
          }

          const token: Token = {
            id: jwtPayload.id,
            name: jwtPayload.name,
            email: jwtPayload.email,
            referral_code: jwtPayload.referral_code,
            role: jwtPayload.role,
          };
          logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);
          const response = await likeService.getLikeListForStore(token);
          const getLikeListForStoreResult = await response?.json();

          if (!getLikeListForStoreResult) {
            logger.error("리스트 요청 실패");
            return new Response(
              JSON.stringify({
                success: false,
                message: "리스트 요청 실패",
                error: getLikeListForStoreResult.error,
              }),
              { status: getLikeListForStoreResult.status || 500 },
            );
          } else if (getLikeListForStoreResult.length === 0) {
            // 좋아요 누른 가게 없는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "좋아한 가게가 없습니다.",
              }),
              { status: 204 },
            );
          } else {
            // 좋아요 누른 가게 목록 조회 성공
            return new Response(
              JSON.stringify({
                success: true,
                message: "좋아요 목록 조회 성공",
                data: getLikeListForStoreResult,
              }),
              { status: 200 },
            );
          }
        }
        if (param1 === "likeMembershipList") {
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
              { status: 401 },
            );
          }

          const token: Token = {
            id: jwtPayload.id,
            name: jwtPayload.name,
            email: jwtPayload.email,
            referral_code: jwtPayload.referral_code,
            role: jwtPayload.role,
          };
          logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);
          const response = await likeService.getLikeListForMembership(token);
          const getLikeListForMembershipResult = await response?.json();

          if (!getLikeListForMembershipResult) {
            logger.error("리스트 요청 실패");
            return new Response(
              JSON.stringify({
                success: false,
                message: "리스트 요청 실패",
                error: getLikeListForMembershipResult.error,
              }),
              { status: getLikeListForMembershipResult.status || 500 },
            );
          } else if (getLikeListForMembershipResult.length === 0) {
            // 좋아요 누른 가게 없는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "좋아한 멤버쉽이 없습니다.",
              }),
              { status: 204 },
            );
          } else {
            // 좋아요 누른 가게 목록 조회 성공
            return new Response(
              JSON.stringify({
                success: true,
                message: "좋아요 목록 조회 성공",
                data: getLikeListForMembershipResult,
              }),
              { status: 200 },
            );
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          // 예외 처리: 내부 서버 오류
          logger.error(`처리 중 예외 발생: ${error.message}`);
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500 },
          );
        }
      }
      break;
  }
};
export { handler as POST, handler as GET, handler as DELETE };

//  case "DELETE":
//       try {
//         if (param1 === "removeStoreLike" && param2) {
//           // 인증 토큰 검증
//           if (!accessToken) {
//             logger.error("인증 토큰 누락");
//             return new Response(JSON.stringify({ error: "인증 없음" }), {
//               status: 401,
//             });
//           }

//           const jwtPayload = verifyJwt(accessToken);
//           if (!jwtPayload || !jwtPayload.id) {
//             logger.error("인증 토큰 검증 실패");
//             return new Response(
//               JSON.stringify({ error: "유효하지 않은 토큰" }),
//               { status: 401 }
//             );
//           }

//           const token: Token = {
//             id: jwtPayload.id,
//             name: jwtPayload.name,
//             email: jwtPayload.email,
//             referral_code: jwtPayload.referral_code,
//           };
//           logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);

//           // 'remove' DELETE 요청 시작
//           logger.info(`좋아요 ${param2} 삭제 요청 시작`);

//           const store_id = Number(param2);
//           const body = await req.param2;

//           // RemoveNoticeLikeRequest 객체 생성
//           const removeStoreLikeRequest: RemoveStoreLikeRequest = {
//             store_id: store_id,
//             user_id: token.id, // 토큰에서 사용자 ID 추출
//           };

//           const response = await likeService.removeStoreLike(
//             removeStoreLikeRequest,
//             token.id,
//             body
//           );
//           logger.info("좋아요 삭제 서비스 요청 완료");

//           const removeLike = await response?.json();
//           if (!removeLike || removeLike.length === 0) {
//             // 좋아요 삭제 실패
//             logger.error("좋아요 삭제 실패");
//             return new Response(
//               JSON.stringify({
//                 success: false,
//                 message: "removeLike failed",
//                 data: removeLike,
//               }),
//               { status: 401 }
//             );
//           } else {
//             // 좋아요 삭제 성공
//             logger.info("좋아요 삭제 성공");
//             return new Response(
//               JSON.stringify({
//                 success: true,
//                 message: "removeLike successful",
//                 data: removeLike,
//               }),
//               { status: 200 }
//             );
//           }
//         }
//         if (param1 === "removeInfluencerLike" && param2) {
//           // 인증 토큰이 누락된 경우
//           // 인증 토큰 검증
//           if (!accessToken) {
//             logger.error("인증 토큰 누락");
//             return new Response(JSON.stringify({ error: "인증 없음" }), {
//               status: 401,
//             });
//           }

//           const jwtPayload = verifyJwt(accessToken);
//           if (!jwtPayload || !jwtPayload.id) {
//             logger.error("인증 토큰 검증 실패");
//             return new Response(
//               JSON.stringify({ error: "유효하지 않은 토큰" }),
//               { status: 401 }
//             );
//           }

//           const token: Token = {
//             id: jwtPayload.id,
//             name: jwtPayload.name,
//             email: jwtPayload.email,
//             referral_code: jwtPayload.referral_code,
//           };
//           logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);

//           // 'remove' DELETE 요청 시작
//           logger.info(`좋아요 ${param2} 삭제 요청 시작`);

//           const influencer_id = Number(param2);
//           const body = await req.param2;

//           // RemoveInfluencerLikeRequest 객체 생성
//           const removeInfluencerLikeRequest: RemoveInfluencerLikeRequest = {
//             influencer_id: influencer_id,
//             user_id: token.id, // 토큰에서 사용자 ID 추출
//           };

//           const response = await likeService.removeInfluencerLike(
//             removeInfluencerLikeRequest,
//             token.id,
//             body
//           );
//           logger.info("좋아요 삭제 서비스 요청 완료");

//           const removeLike = await response?.json();
//           if (!removeLike || removeLike.length === 0) {
//             // 좋아요 삭제 실패
//             logger.error("좋아요 삭제 실패");
//             return new Response(
//               JSON.stringify({
//                 success: false,
//                 message: "removeLike failed",
//                 data: removeLike,
//               }),
//               { status: 401 }
//             );
//           } else {
//             // 좋아요 삭제 성공
//             logger.info("좋아요 삭제 성공");
//             return new Response(
//               JSON.stringify({
//                 success: true,
//                 message: "removeLike successful",
//                 data: removeLike,
//               }),
//               { status: 200 }
//             );
//           }
//         }
//         if (param1 === "removeNoticeLike" && param2) {
//           // 인증 토큰 검증
//           if (!accessToken) {
//             logger.error("인증 토큰 누락");
//             return new Response(JSON.stringify({ error: "인증 없음" }), {
//               status: 401,
//             });
//           }

//           const jwtPayload = verifyJwt(accessToken);
//           if (!jwtPayload || !jwtPayload.id) {
//             logger.error("인증 토큰 검증 실패");
//             return new Response(
//               JSON.stringify({ error: "유효하지 않은 토큰" }),
//               { status: 401 }
//             );
//           }

//           const token: Token = {
//             id: jwtPayload.id,
//             name: jwtPayload.name,
//             email: jwtPayload.email,
//             referral_code: jwtPayload.referral_code,
//           };
//           logger.info(`토큰 검증 성공: 사용자 ID ${token.id}`);

//           // 'remove' DELETE 요청 시작
//           logger.info(`좋아요 ${param2} 삭제 요청 시작`);

//           const notice_id = Number(param2);
//           const body = await req.param2;

//           // RemoveNoticeLikeRequest 객체 생성
//           const removeNoticeLikeRequest: RemoveNoticeLikeRequest = {
//             notice_id: notice_id,
//             user_id: token.id, // 토큰에서 사용자 ID 추출
//           };

//           const response = await likeService.removeNoticeLike(
//             removeNoticeLikeRequest,
//             token.id,
//             body
//           );
//           logger.info("좋아요 삭제 서비스 요청 완료");

//           const removeLike = await response?.json();
//           if (!removeLike || removeLike.length === 0) {
//             // 좋아요 삭제 실패
//             logger.error("좋아요 삭제 실패");
//             return new Response(
//               JSON.stringify({
//                 success: false,
//                 message: "removeLike failed",
//                 data: removeLike,
//               }),
//               { status: 401 }
//             );
//           } else {
//             // 좋아요 삭제 성공
//             logger.info("좋아요 삭제 성공");
//             return new Response(
//               JSON.stringify({
//                 success: true,
//                 message: "removeLike successful",
//                 data: removeLike,
//               }),
//               { status: 200 }
//             );
//           }
//         } else {
//           // 알 수 없는 요청
//           logger.error(`알 수 없는 요청: ${param1}`);
//           return new Response(JSON.stringify({ error: "Invalid request" }), {
//             status: 400,
//           });
//         }
//       } catch (error) {
//         if (error instanceof Error) {
//           // 예외 처리: 내부 서버 오류
//           logger.error(`처리 중 예외 발생: ${error.message}`);
//           return new Response(
//             JSON.stringify({ error: "Internal server error" }),
//             { status: 500 }
//           );
//         }
//       }
//       break;
