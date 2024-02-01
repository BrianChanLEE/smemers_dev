import { PrismaClient } from "@prisma/client";
import {
  NoticeRequest,
  Notice,
  NoticeUpdateData,
} from "@/types/interface/notice_Interface";
import { Token } from "@/types/interface/Token_Interface";
import Logger from "@/src/middleware/logger";

const logger = new Logger("logs");
const prisma = new PrismaClient();

/**
 * 공지사항 생성 처리 함수
 * 이 함수는 사용자가 관리자 권한을 가진 경우에만 공지사항을 생성할 수 있습니다. 사용자의 역할과 요청된 데이터의 유효성을 검증한 후 공지사항을 생성합니다.
 *
 * @param {NoticeRequest} req 요청 객체. 공지사항의 제목, 내용, 시작 및 종료 날짜 등이 포함됩니다.
 * @param {Token} token 사용자 인증 토큰. 사용자의 ID와 역할을 확인하는 데 사용됩니다.
 * @returns {Response} 공지사항 생성 결과에 대한 응답.
 *                     관리자가 아닐 경우 403(Forbidden) 상태 코드와 접근 제한 메시지 반환.
 *                     제목 또는 내용이 누락된 경우 400(Bad Request) 상태 코드와 오류 메시지 반환.
 *                     공지사항 생성 성공 시 201(Created) 상태 코드와 생성된 공지사항 정보를 포함한 응답 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자 인증 토큰을 통해 사용자 역할 확인.
 * 2. 관리자가 아닐 경우 접근 제한 처리.
 * 3. 요청 데이터의 유효성 검증.
 * 4. 공지사항 데이터 생성 및 저장.
 * 5. 생성된 공지사항 데이터 직렬화 및 반환.
 * 6. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */

export async function noticeCreate(req: NoticeRequest, token: Token) {
  try {
    // 사용자의 역할 확인
    const user = await prisma.user.findUnique({
      where: { id: parseInt(token.id) },
    });

    // 사용자가 Admin이 아니거나 사용자 정보가 없는 경우 접근 제한
    if (!user || user.role !== "Admin") {
      return new Response(
        JSON.stringify({ error: "접근 권한이 없습니다." }),
        { status: 403 } // Forbidden
      );
    }

    // 요청 검증: 제목과 내용이 비어 있는지 확인
    if (!req.subject || !req.contents) {
      // 비어 있는 경우 400 (Bad Request) 상태 코드와 오류 메시지를 반환
      return new Response(
        JSON.stringify({ error: "제목과 내용을 모두 입력해 주세요." }),
        { status: 400 }
      );
    }

    // 공지 객체 생성
    const notice: Notice = {
      subject: req.subject,
      contents: req.contents,
      StartDate: req.StartDate,
      EndDate: req.EndDate,
      user_id: parseInt(token.id),
    };

    // 공지사항 저장
    const createdNotice = await prisma.notices.create({
      data: notice,
    });

    // 저장된 공지사항을 직렬화하여 필요한 데이터만 추출
    const serializedNotice = {
      id: createdNotice.id.toString(),
      subject: createdNotice.subject,
      contents: createdNotice.contents,
      user_id: createdNotice.user_id?.toString,
    };

    // 성공적으로 생성된 경우 201 (Created) 상태 코드와 함께 응답 반환
    return new Response(JSON.stringify(serializedNotice), {
      status: 201,
    });
  } catch (error) {
    if (error instanceof Error) {
      // 오류 발생 시 오류 메시지 출력
      console.error("noticeCreate error:", error.message);

      // 서버 내부 오류인 경우 500 (Internal Server Error) 상태 코드와 오류 메시지를 반환
      return new Response(JSON.stringify({ error: "서버 내부 오류 발생" }), {
        status: 500,
      });
    }
  }
}

/************************************************************************************************************/

/**
 * 모든 공지사항 조회 처리 함수
 * 이 함수는 시스템에 저장된 모든 공지사항을 조회합니다. 조회된 공지사항이 없는 경우와 오류 발생 시 적절한 HTTP 상태 코드와 응답 메시지를 반환합니다.
 *
 * @returns {Response} 공지사항 조회 결과에 대한 응답.
 *                     조회된 공지사항이 없는 경우 204(No Content) 상태 코드와 메시지 반환.
 *                     공지사항 조회 성공 시 200(OK) 상태 코드와 조회된 공지사항 목록을 포함한 응답 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 시스템에서 모든 공지사항 조회.
 * 2. 조회된 공지사항이 없는 경우 적절한 메시지와 함께 204 상태 코드 반환.
 * 3. 조회된 공지사항이 있는 경우 직렬화하여 필요한 정보만 추출.
 * 4. 공지사항 목록과 함께 200 상태 코드 반환.
 * 5. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */

export async function findAllNotice() {
  try {
    // 모든 공지사항을 조회
    const data = await prisma.notices.findMany({});

    if (data.length === 0) {
      return new Response(
        JSON.stringify({ message: "조회할 공지사항이 없습니다." }),
        { status: 204 } // No Content
      );
    }

    // 조회된 공지사항 데이터 배열을 직렬화하여 필요한 데이터만 추출
    const serializedNotice = data.map((notices) => ({
      id: notices.id.toString(),
      subject: notices.subject,
      contents: notices.contents,
      StartDate: notices.StartDate,
      EndDate: notices.EndDate,
    }));

    // 성공적으로 조회된 경우 200 (OK) 상태 코드와 함께 응답 반환
    return new Response(JSON.stringify(serializedNotice), {
      status: 200,
    });
  } catch (error) {
    if (error instanceof Error) {
      // 오류 발생 시 오류 메시지 출력
      console.error("findAllNotice error:", error.message);

      // 서버 내부 오류인 경우 500 (Internal Server Error) 상태 코드와 오류 메시지를 반환
      return new Response(JSON.stringify({ error: "서버 내부 오류 발생" }), {
        status: 500,
      });
    }
  }
}

/************************************************************************************************************\

/**
 * 특정 ID의 공지사항 조회 처리 함수
 * 이 함수는 주어진 ID에 해당하는 공지사항을 조회합니다. 조회된 공지사항이 없거나 입력된 ID가 유효하지 않은 경우, 적절한 HTTP 상태 코드와 응답 메시지를 반환합니다.
 *
 * @param {number} id 조회하고자 하는 공지사항의 ID.
 * @returns {Response} 공지사항 조회 결과에 대한 응답.
 *                     잘못된 ID 입력 시 400(Bad Request) 상태 코드와 오류 메시지 반환.
 *                     해당 ID의 공지사항이 존재하지 않는 경우 404(Not Found) 상태 코드와 메시지 반환.
 *                     공지사항 조회 성공 시 200(OK) 상태 코드와 조회된 공지사항 정보를 포함한 응답 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 입력된 ID의 유효성 검사.
 * 2. 주어진 ID로 공지사항 조회.
 * 3. 조회된 공지사항이 없는 경우 적절한 메시지와 함께 404 상태 코드 반환.
 * 4. 조회된 공지사항 정보를 직렬화하여 반환.
 * 5. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */

export async function findNoticeById(id: number) {
  try {
    // ID 유효성 검사
    if (!id || id <= 0) {
      return new Response(JSON.stringify({ error: "잘못된 ID입니다." }), {
        status: 400,
      }); // Bad Request
    }

    // Prisma를 사용하여 주어진 ID로 게시글 조회
    const data = await prisma.notices.findUnique({
      where: { id: id },
    });

    if (!data) {
      // 조회된 게시글이 없는 경우
      return new Response(
        JSON.stringify({ message: `ID가 ${id}인 게시글을 찾을 수 없습니다.` }),
        { status: 404 } // Not Found
      );
    }

    // 조회된 게시글을 직렬화하여 필요한 데이터만 추출
    const serializedNotice = {
      id: data.id.toString(),
      subject: data.subject,
      contents: data.contents,
    };

    return new Response(JSON.stringify(serializedNotice), { status: 200 }); // OK
  } catch (error) {
    if (error instanceof Error) {
      console.error("Notice error:", error.message);
      return new Response(JSON.stringify({ error: "서버 내부 오류 발생" }), {
        status: 500, // Internal Server Error
      });
    }
  }
}

/************************************************************************************************************\
 
/**
 * 비공개된 모든 공지사항 조회 처리 함수
 * 이 함수는 Prisma를 사용하여 데이터베이스에서 상태가 'PRIVATE'인 모든 공지사항을 조회합니다.
 * 조회된 데이터가 없는 경우 적절한 HTTP 상태 코드와 응답 메시지를 반환하며, 조회된 데이터가 있을 경우 해당 데이터를 직렬화하여 반환합니다.
 * @param {Token} token 사용자 인증 토큰. 사용자의 ID와 역할을 확인하는 데 사용됩니다.
 * @returns {Response} 공지사항 조회 결과에 대한 응답.
 *                     공개된 공지사항이 없는 경우 204(No Content) 상태 코드와 메시지 반환.
 *                     공지사항 조회에 성공한 경우 200(OK) 상태 코드와 조회된 공지사항 정보를 포함한 응답 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자 인증 토큰을 통해 사용자 역할 확인.
 * 2. 관리자가 아닐 경우 접근 제한 처리.
 * 3. 상태가 'PRIVATE'인 모든 공지사항 조회.
 * 4. 조회된 공지사항이 없는 경우 적절한 메시지와 함께 204 상태 코드 반환.
 * 5. 조회된 공지사항 정보를 직렬화하여 반환.
 * 6. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export const findAllPrivateNotice = async (token: Token) => {
  try {
    // 사용자의 역할 확인
    const user = await prisma.user.findUnique({
      where: { id: parseInt(token.id) },
    });

    // 사용자가 Admin이 아니거나 사용자 정보가 없는 경우 접근 제한
    if (!user || user.role !== "Admin") {
      return new Response(
        JSON.stringify({ error: "접근 권한이 없습니다." }),
        { status: 403 } // Forbidden
      );
    }

    // Prisma를 사용하여 공개된 모든 게시글 조회
    const data = await prisma.notices.findMany({
      where: { status: "PRIVATE" },
    });

    if (data.length === 0) {
      return new Response(
        JSON.stringify({ message: "비공개 게시글이 없습니다." }),
        { status: 200 } // OK
      );
    }

    // 조회된 게시글을 직렬화하여 필요한 데이터만 추출
    const serializedNotice = data.map((notice) => ({
      id: notice.id.toString(),
      subject: notice.subject,
      contents: notice.contents,
    }));

    return new Response(
      JSON.stringify({ message: "조회 성공.", serializedNotice }),
      { status: 200 } // OK
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      return new Response(
        JSON.stringify({
          message: "게시글 조회 오류 발생",
          error: error.message,
        }),
        { status: 500 } // Internal Server Error
      );
    }
  }
};

/************************************************************************************************************\

/**
 * 공지사항 업데이트 처리 함수
 * 이 함수는 사용자가 제공한 데이터를 기반으로 특정 공지사항을 업데이트합니다.
 * 사용자가 'Admin' 역할이 아닐 경우, 또는 제공된 데이터가 유효하지 않을 경우, 적절한 HTTP 상태 코드와 오류 메시지를 반환합니다.
 * 존재하지 않는 게시글을 업데이트하려 할 경우, 404 오류를 반환합니다.
 *
 * @param {Object} data 업데이트할 공지사항 데이터.
 * @param {number} noticeId 업데이트할 공지사항의 ID.
 * @param {Object} token 사용자 토큰.
 * @returns {Response} 공지사항 업데이트 결과에 대한 응답.
 *                     접근 권한이 없는 경우 403(Forbidden) 상태 코드와 오류 메시지 반환.
 *                     데이터 무효 시 400(Bad Request) 상태 코드와 오류 메시지 반환.
 *                     해당 게시글이 없는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     업데이트 성공 시 200(OK) 상태 코드와 업데이트된 공지사항 정보를 포함한 응답 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자 역할 확인 및 권한 검증.
 * 2. 제공된 데이터의 유효성 검사.
 * 3. 게시글 존재 여부 확인.
 * 4. 공지사항 데이터 업데이트.
 * 5. 업데이트된 공지사항 정보 반환.
 * 6. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */

export async function updateNotice(
  data: NoticeUpdateData,
  noticeId: number,
  token: Token
) {
  try {
    // 사용자의 역할 확인
    const user = await prisma.user.findUnique({
      where: { id: parseInt(token.id) },
    });
    if (!user || user.role !== "Admin") {
      return new Response(JSON.stringify({ error: "접근 권한이 없습니다." }), {
        status: 403,
      });
    }

    // 데이터 유효성 검사
    if (!data.subject || !data.contents) {
      return new Response(
        JSON.stringify({ error: "제목과 내용을 모두 입력해 주세요." }),
        { status: 400 }
      );
    }

    // 게시글 존재 여부 확인
    const existingNotice = await prisma.notices.findUnique({
      where: { id: noticeId },
    });
    if (!existingNotice) {
      return new Response(
        JSON.stringify({ error: "게시글을 찾을 수 없습니다." }),
        { status: 404 }
      );
    }

    // 게시글 업데이트
    const updatedNotice = await prisma.notices.update({
      where: { id: noticeId },
      data: {
        subject: data.subject,
        contents: data.contents,
        StartDate: data.StartDate,
        EndDate: data.EndDate,
      },
    });

    logger.info("게시글 업데이트 성공");
    const serializedNotice = {
      id: updatedNotice.id.toString(),
      subject: updatedNotice.subject,
      contents: updatedNotice.contents,
      StartDate: updatedNotice.StartDate,
      EndDate: updatedNotice.EndDate,
    };
    return new Response(JSON.stringify(serializedNotice), { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`처리 중 예외 발생: ${error.message}`);
      return new Response(JSON.stringify({ error: "서버 내부 오류 발생" }), {
        status: 500,
      });
    }
  }
}

/************************************************************************************************************\

/**
 * 공지사항 삭제 처리 함수
 * 이 함수는 주어진 ID의 공지사항을 삭제합니다. 삭제 과정에서는 사용자의 역할을 확인하고, ID의 유효성을 검증합니다.
 * Admin 역할이 아닌 사용자나 존재하지 않는 공지사항에 대한 삭제 요청 시, 적절한 HTTP 상태 코드와 오류 메시지를 반환합니다.
 *
 * @param {Object} token 사용자 토큰.
 * @param {number} id 삭제할 공지사항의 ID.
 * @returns {Response} 공지사항 삭제 결과에 대한 응답.
 *                     접근 권한이 없는 경우 403(Forbidden) 상태 코드와 오류 메시지 반환.
 *                     잘못된 ID인 경우 400(Bad Request) 상태 코드와 오류 메시지 반환.
 *                     해당 게시글이 없는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     삭제 성공 시 200(OK) 상태 코드와 삭제 성공 메시지 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자 역할 확인 및 권한 검증.
 * 2. ID 유효성 검사.
 * 3. 공지사항 존재 여부 확인.
 * 4. 공지사항 삭제 처리.
 * 5. 성공 및 오류 응답 반환.
 */
export async function removeNotice(token: Token, id: number) {
  try {
    // 사용자의 역할 확인
    const user = await prisma.user.findUnique({
      where: { id: parseInt(token.id) },
    });

    // 사용자가 Admin이 아니거나 사용자 정보가 없는 경우 접근 제한
    if (!user || user.role !== "Admin") {
      return new Response(
        JSON.stringify({ error: "접근 권한이 없습니다." }),
        { status: 403 } // Forbidden
      );
    }

    // ID 유효성 검사
    if (!id || id <= 0) {
      return new Response(JSON.stringify({ error: "잘못된 ID입니다." }), {
        status: 400, // Bad Request
      });
    }

    // Prisma를 사용하여 주어진 ID로 게시글 조회
    const existingNotice = await prisma.notices.findUnique({
      where: { id: id },
    });

    if (!existingNotice) {
      // 조회된 게시글이 없는 경우
      return new Response(
        JSON.stringify({ message: `ID가 ${id}인 게시글을 찾을 수 없습니다.` }),
        { status: 404 } // Not Found
      );
    }

    // 게시글 삭제 처리
    await prisma.notices.delete({
      where: { id: id },
    });

    // 삭제 성공 메시지 반환
    return new Response(
      JSON.stringify({ message: "게시글이 삭제되었습니다." }),
      {
        status: 200, // OK
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`게시글 삭제 처리 중 오류 발생: ${error.message}`);
      return new Response(JSON.stringify({ error: "내부 서버 오류" }), {
        status: 500, // Internal Server Error
      });
    }
  }
}
