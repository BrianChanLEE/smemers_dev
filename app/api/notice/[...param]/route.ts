import * as noticeService from "@/src/_services/noticeService";
import Logger from "@/src/middleware/logger";
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
  logger.info(`요청 시작: ${method} ${param1} ${param2}`);
  switch (method) {
    case "POST":
      try {
        // "write" 파라미터로 들어온 경우
        if (param1 === "write") {
          // 인증 토큰 검증
          if (!accessToken) {
            logger.error("인증 토큰 누락");
            return new Response(
              JSON.stringify({ error: "인증이 필요합니다." }),
              {
                status: 401,
              }
            );
          }

          const jwtPayload = verifyJwt(accessToken);
          if (!jwtPayload || !jwtPayload.id || jwtPayload.role !== "Admin") {
            logger.error("인증 토큰 검증 실패 또는 관리자 권한 없음");
            return new Response(
              JSON.stringify({ error: "접근 권한이 없습니다." }),
              { status: 403 }
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

          // 공지사항 생성 서비스 호출
          const response = await noticeService.noticeCreate(body, token);

          if (!response) {
            logger.error("공지사항 생성 요청에 대한 응답이 없습니다.");
            return new Response(JSON.stringify({ error: "서비스 응답 없음" }), {
              status: 500,
            });
          }

          const createNoticeResult = await response.json();

          if (!createNoticeResult || createNoticeResult.error) {
            logger.error("공지사항 생성 실패");
            return new Response(
              JSON.stringify({
                success: false,
                message: "공지사항 생성에 실패했습니다.",
                error: createNoticeResult.error,
              }),
              { status: createNoticeResult.status || 500 }
            );
          } else {
            logger.info("공지사항 생성 성공");
            return new Response(
              JSON.stringify({
                success: true,
                message: "공지사항이 성공적으로 생성되었습니다.",
                data: createNoticeResult,
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
          return new Response(JSON.stringify({ error: "서버 내부 오류" }), {
            status: 500,
          });
        }
      }
      break;

    case "PUT":
      try {
        if (param1 === "update" && param2) {
          // 로깅: 게시글 ID로 수정 요청 시작
          logger.info(`게시글 ID ${param2} 수정 요청 시작`);
          // 인증 토큰 검증
          if (!accessToken) {
            logger.error("인증 토큰 누락");
            return new Response(
              JSON.stringify({ error: "인증이 필요합니다." }),
              {
                status: 401,
              }
            );
          }

          const jwtPayload = verifyJwt(accessToken);
          if (!jwtPayload || !jwtPayload.id || jwtPayload.role !== "Admin") {
            logger.error("인증 토큰 검증 실패 또는 관리자 권한 없음");
            return new Response(
              JSON.stringify({ error: "접근 권한이 없습니다." }),
              { status: 403 }
            );
          }

          const token: Token = {
            id: jwtPayload.id,
            name: jwtPayload.name,
            email: jwtPayload.email,
            referral_code: jwtPayload.referral_code,
            role: jwtPayload.role,
          };

          // 게시글 ID 파싱
          const id = Number(param2);
          if (isNaN(id)) {
            logger.error("유효하지 않은 ID");

            // 유효하지 않은 ID가 전달된 경우 400 (Bad Request) 상태 코드 반환
            return new Response(JSON.stringify({ error: "Invalid ID" }), {
              status: 400,
            });
          }

          // 요청 본문 파싱
          const requestBody = await req.json();
          const data = {
            subject: requestBody.subject,
            contents: requestBody.contents,
            StartDate: requestBody.StartDate,
            EndDate: requestBody.EndDate,
          };
          logger.info("수정할 데이터 파싱 완료");

          // 게시글 수정 서비스 호출
          const updateNoticeResult = await noticeService.updateNotice(
            data,
            id,
            token
          );
          logger.info("게시글 수정 서비스 요청 완료");
          const result = await updateNoticeResult!.json();

          if (updateNoticeResult && updateNoticeResult.status === 200) {
            logger.info("게시글 수정 성공");

            // 게시글 수정 성공 시 200 (OK) 상태 코드 반환
            return new Response(
              JSON.stringify({
                success: true,
                message: "게시글 수정 성공",
                data: result,
              }),
              { status: 200 }
            );
          } else {
            return new Response(
              JSON.stringify({
                success: false,
                message: "게시글 수정 실패",
                error: result.error,
              }),
              { status: result.status || 500 }
            );
          }
        } else {
          return new Response(JSON.stringify({ error: "잘못된 요청" }), {
            status: 400,
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`처리 중 예외 발생: ${error.message}`);
          return new Response(JSON.stringify({ error: "서버 내부 오류" }), {
            status: 500,
          });
        }
      }
      break;

    case "GET":
      try {
        // "findAll" 파라미터로 들어온 경우
        if (param1 === "findAll") {
          logger.info(`모든 공지사항 조회 시작`);
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

          // 공지사항 서비스를 호출하여 모든 공지사항 조회
          const response = await noticeService.findAllNotice();

          if (!response) {
            logger.error("공지사항 서비스 응답 없음");
            // 서비스 응답이 없을 경우 503 (Service Unavailable) 상태 코드 반환
            return new Response(
              JSON.stringify({ error: "서비스를 사용할 수 없습니다." }),
              { status: 503 }
            );
          }

          const findAllNoticeResult = await response.json();
          logger.info("모든 공지사항 조회 서비스 요청 완료");

          if (!findAllNoticeResult || findAllNoticeResult.length === 0) {
            logger.error("조회된 공지사항이 없습니다.");
            // 데이터가 없을 경우 204 (No Content) 상태 코드 반환
            return new Response(
              JSON.stringify({
                success: true,
                message: "조회된 공지사항이 없습니다.",
              }),
              { status: 204 }
            );
          } else {
            logger.info("공지사항 조회 성공");
            // 데이터가 있을 경우 200 (OK) 상태 코드 반환
            return new Response(
              JSON.stringify({
                success: true,
                message: "공지사항 조회에 성공했습니다.",
                data: findAllNoticeResult,
              }),
              { status: 200 }
            );
          }
        }
        if (param1 === "findOne" && param2) {
          console.log("조회 조건:", param1, "ID:", param2);

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

          const id = param2;
          // 공지사항 서비스를 호출하여 특정 ID의 게시글을 찾습니다.
          const response = await noticeService.findNoticeById(Number(id));

          if (!response) {
            logger.error("공지사항 서비스 응답 없음");
            // 서비스 응답이 없을 경우 503 (Service Unavailable) 상태 코드 반환
            return new Response(
              JSON.stringify({ error: "서비스를 사용할 수 없습니다." }),
              { status: 503 }
            );
          }

          const findOneNoticeResult = await response.json();
          logger.info("특정 ID의 공지사항 찾기 서비스 요청 완료");

          if (!findOneNoticeResult) {
            // 조회된 공지사항이 없는 경우
            return new Response(
              JSON.stringify({
                success: false,
                message: "해당 ID의 공지사항이 존재하지 않습니다.",
              }),
              { status: 404 }
            );
          } else {
            // 조회된 공지사항이 있는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "공지사항 조회 성공",
                data: findOneNoticeResult,
              }),
              { status: 200 }
            );
          }
        }

        // "PRIVATE" 파라미터가 제공된 경우
        if (param1 === "PRIVATE") {
          console.log("조회 조건:", param1);

          // 인증 토큰 검증
          if (!accessToken) {
            logger.error("인증 토큰 누락");
            return new Response(
              JSON.stringify({ error: "인증이 필요합니다." }),
              {
                status: 401,
              }
            );
          }

          const jwtPayload = verifyJwt(accessToken);
          if (!jwtPayload || !jwtPayload.id || jwtPayload.role !== "Admin") {
            logger.error("인증 토큰 검증 실패 또는 관리자 권한 없음");
            return new Response(
              JSON.stringify({ error: "접근 권한이 없습니다." }),
              { status: 403 }
            );
          }

          const token: Token = {
            id: jwtPayload.id,
            name: jwtPayload.name,
            email: jwtPayload.email,
            referral_code: jwtPayload.referral_code,
            role: jwtPayload.role,
          };
          // 공지사항 서비스를 호출하여 비공개된 모든 공지사항 조회
          const response = await noticeService.findAllPrivateNotice(token);

          if (!response) {
            logger.error("공지사항 서비스 응답 없음");
            // 서비스 응답이 없는 경우 503 (Service Unavailable) 상태 코드 반환
            return new Response(
              JSON.stringify({ error: "서비스를 사용할 수 없습니다." }),
              { status: 503 }
            );
          }

          const findPublicNoticeResult = await response.json();
          logger.info("비공개된 모든 공지사항 찾기 서비스 요청 완료");

          if (!findPublicNoticeResult || findPublicNoticeResult.length === 0) {
            // 조회된 공지사항이 없는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "비공개된 공지사항이 없습니다.",
              }),
              { status: 204 }
            );
          } else {
            // 조회된 공지사항이 있는 경우
            return new Response(
              JSON.stringify({
                success: true,
                message: "비공개된 공지사항 조회 성공",
                data: findPublicNoticeResult,
              }),
              { status: 200 }
            );
          }
        }
      } catch (error) {
        // 예외 발생 시 처리
        if (error instanceof Error) {
          logger.error(`처리 중 예외 발생: ${error.message}`);
          console.error(error.message);
          // 500 (Internal Server Error) 상태 코드 반환
          return new Response(JSON.stringify({ error: "서버 내부 오류" }), {
            status: 500,
          });
        }
      }
      break;

    case "DELETE":
      try {
        if (param1 === "delete" && param2) {
          logger.info(`게시글 ID ${param2} 삭제 요청 시작`);

          // 인증 토큰 검증
          if (!accessToken) {
            logger.error("인증 토큰 누락");
            return new Response(
              JSON.stringify({ error: "인증이 필요합니다." }),
              {
                status: 401,
              }
            );
          }

          const jwtPayload = verifyJwt(accessToken);
          if (!jwtPayload || !jwtPayload.id || jwtPayload.role !== "Admin") {
            logger.error("인증 토큰 검증 실패 또는 관리자 권한 없음");
            return new Response(
              JSON.stringify({ error: "접근 권한이 없습니다." }),
              { status: 403 }
            );
          }

          const token: Token = {
            id: jwtPayload.id,
            name: jwtPayload.name,
            email: jwtPayload.email,
            referral_code: jwtPayload.referral_code,
            role: jwtPayload.role,
          };

          const id = Number(param2);
          if (isNaN(id)) {
            logger.error("유효하지 않은 ID");
            return new Response(JSON.stringify({ error: "유효하지 않은 ID" }), {
              status: 400,
            });
          }

          const deleteNoticeResult = await noticeService.removeNotice(
            token,
            id
          );
          if (!deleteNoticeResult) {
            logger.error("게시글 삭제 실패");
            return new Response(
              JSON.stringify({
                success: false,
                message: "게시글 삭제 실패",
                error: deleteNoticeResult,
              }),
              { status: 500 }
            );
          } else {
            logger.info("게시글 삭제 성공");
            return new Response(
              JSON.stringify({
                success: true,
                message: "게시글 삭제 성공",
              }),
              { status: 200 }
            );
          }
        } else {
          logger.error(`알 수 없는 요청: ${param1}`);
          return new Response(JSON.stringify({ error: "잘못된 요청" }), {
            status: 400,
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`처리 중 예외 발생: ${error.message}`);
          return new Response(JSON.stringify({ error: "서버 내부 오류" }), {
            status: 500,
          });
        }
      }
      break;
  }
};

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };

/************************************************************************************************************/
// import * as noticeService from "@/src/_services/noticeService";
// import { verifyJwt } from "@/src/lib/jwt";

// // 비동기 함수로 선언하여 비동기 호출을 적절히 처리합니다.
// export default async function handler(req, res) {
//     // 요청 메서드를 구조 분해 할당으로 추출합니다.
//     const { method } = req;
//     // req.params에서 param1과 param2를 구조 분해 할당으로 추출합니다.
//     const [param1, param2] = req.params;

//     // GET 메서드가 아닌 경우, 405 Method Not Allowed 오류를 반환합니다.
//     if (method !== "GET") {
//         res.status(405).json({ error: "Method not allowed" });
//         return;
//     }

//     // 요청 헤더에서 인증 토큰을 추출합니다.
//     const accessToken = req.headers.authorization;

//     // 인증 토큰이 없거나 유효하지 않은 경우, 401 Unauthorized 오류를 반환합니다.
//     if (!accessToken || !verifyJwt(accessToken)) {
//         res.status(401).json({ error: "No Authorization" });
//         return;
//     }

//     try {
//         // param1의 값에 따라 다른 동작을 수행합니다.
//         switch (param1) {
//             case "findAll":
//                 // 모든 공지사항을 조회합니다.
//                 const findAllResponse = await noticeService.findAllNotice();
//                 const findAllData = await findAllResponse.json();
//                 if (!findAllData || findAllData.length === 0) {
//                     res.status(404).json({ success: false, message: "No notices found" });
//                 } else {
//                     res.status(200).json({ success: true, data: findAllData });
//                 }
//                 break;

//             case "findOne":
//                 // 특정 ID를 가진 공지사항을 조회합니다.
//                 const id = Number(param2);
//                 const findOneResponse = await noticeService.findOneNotice(id);
//                 const findOneData = await findOneResponse.json();
//                 if (!findOneData) {
//                     res.status(404).json({ success: false, message: "Notice not found" });
//                 } else {
//                     res.status(200).json({ success: true, data: findOneData });
//                 }
//                 break;

//             case "public":
//                 // 게시된 모든 공지사항을 조회합니다.
//                 const publicResponse = await noticeService.findAllPublishedNotice();
//                 const publicData = await publicResponse.json();
//                 if (!publicData || publicData.length === 0) {
//                     res.status(404).json({ success: false, message: "No published notices found" });
//                 } else {
//                     res.status(200).json({ success: true, data: publicData });
//                 }
//                 break;

//             default:
//                 // 잘못된 요청에 대해 400 Bad Request 오류를 반환합니다.
//                 res.status(400).json({ error: "Invalid request" });
//         }
//     } catch (error) {
//         // 에러 처리: 서버 내부 오류 발생 시 500 Internal Server Error 반환
//         console.error(error.message);
//         res.status(500).json({ error: "Internal server error" });
//     }
// }

/************************************************************************************************************/

/************************************************************************************************************/
