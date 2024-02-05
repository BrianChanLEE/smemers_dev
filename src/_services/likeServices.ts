import prisma from "../lib/prisma"; // 프리즈마 클라이언트 임포트
import Logger from "@/src/middleware/logger";
import {
  CreateLikeNoticeData,
  CreateLikeInfluencerData,
  CreateLikeStoreData,
  CreateLikeMembershipData,
} from "@/types/interface/like_Interface";
import { Token } from "@/types/interface/Token_Interface";
const logger = new Logger("logs");
// 좋아요(Like) 관련 API

/**
 * 공지사항에 대한 좋아요 생성 및 제거 처리 함수
 * 이 함수는 사용자가 특정 공지사항에 대해 좋아요를 표시하거나 제거하는 요청을 처리합니다. 요청된 공지사항 ID에 대해 사용자의 좋아요가 이미 존재하는 경우 좋아요를 제거하고, 존재하지 않는 경우 좋아요를 생성합니다.
 *
 * @param {CreateLikeNoticeData} req 요청 객체. 공지사항 ID 및 기타 필요 데이터를 포함합니다.
 * @param {Token} token 사용자 토큰. 사용자 ID를 추출하기 위해 사용됩니다.
 * @returns {Response} 공지사항에 대한 좋아요 생성 및 제거 결과에 대한 응답.
 *                     해당 공지사항이 존재하지 않는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     이미 좋아요가 존재하는 경우 좋아요 제거 후 200(OK) 상태 코드와 메시지 반환.
 *                     좋아요 생성 성공 시 201(Created) 상태 코드와 생성된 좋아요 정보 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 공지사항의 존재 여부 확인.
 * 2. 사용자의 기존 좋아요 여부 확인.
 * 3. 좋아요 존재 시 제거 및 disabled 설정, 없을 경우 생성 및 disabled 해제.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */

export async function createLikeNotice(
  req: CreateLikeNoticeData,
  token: Token,
) {
  try {
    // 공지사항 존재 여부 확인
    // console.log("token inService:", token);
    const noticeExists = await prisma.notices.findUnique({
      where: { id: req.notice_id },
    });

    if (!noticeExists) {
      logger.error(
        `ID ${req.notice_id}에 해당하는 공지사항을 찾을 수 없습니다.`,
      );
      return new Response(
        JSON.stringify({ error: "해당 공지사항을 찾을 수 없습니다." }),
        { status: 404 }, // Not Found
      );
    }

    // 중복 좋아요 확인
    const existingLike = await prisma.like.findFirst({
      where: {
        notice_id: req.notice_id,
        user_id: token.id,
      },
    });

    if (existingLike) {
      // 이미 좋아요가 있다면 삭제 및 disabled 설정
      await prisma.like.update({
        where: { id: existingLike.id },
        data: {
          notice_id: null,
          disabled: true,
        },
      });
      logger.info(`ID ${req.notice_id}에 대한 좋아요가 제거되었습니다.`);
      return new Response(
        JSON.stringify({ message: "좋아요가 제거되었습니다.", disabled: true }),
        { status: 200 }, // OK
      );
    } else {
      // 좋아요 생성 및 disabled 해제
      const newLike = await prisma.like.create({
        data: {
          notice_id: req.notice_id,
          user_id: token.id,
          disabled: false,
        },
      });

      const serializedLike = {
        id: newLike.id.toString(),
        notice_id: newLike.notice_id!.toString(),
        disabled: newLike.disabled,
      };

      logger.info(`${req.notice_id} 좋아요 생성 성공`);
      return new Response(JSON.stringify(serializedLike), { status: 201 }); // Created
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error("좋아요 처리 중 오류 발생: " + error.message);
      return new Response(
        JSON.stringify({ error: "내부 서버 오류", message: error.message }),
        { status: 500 }, // Internal Server Error
      );
    }
  }
}

/************************************************************************************************************\

/**
 * 사용자가 좋아요를 누른 공지사항 목록 조회 함수
 * 이 함수는 특정 사용자가 좋아요를 누른 공지사항 목록을 조회합니다. 사용자 토큰을 이용해 해당 사용자의 좋아요 목록을 조회하고, 해당하는 공지사항의 ID들을 반환합니다.
 *
 * @param {Token} token 사용자 토큰. 사용자 ID를 추출하기 위해 사용됩니다.
 * @returns {Response} 사용자가 좋아요를 누른 공지사항 목록에 대한 응답.
 *                     좋아요를 누른 공지사항이 없는 경우 204(No Content) 상태 코드와 메시지 반환.
 *                     좋아요를 누른 공지사항 목록 조회 성공 시 200(OK) 상태 코드와 공지사항 ID 목록 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자 ID를 이용하여 좋아요 목록 조회.
 * 2. 좋아요 목록이 비어 있을 경우 204 상태 코드 반환.
 * 3. 좋아요 목록이 존재할 경우 공지사항 ID 목록 생성 및 반환.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function getLikeListForNotice(token: Token) {
  try {
    // 사용자가 좋아요를 누른 공지사항 목록 조회
    const likeListForNotice = await prisma.like.findMany({
      where: { user_id: token.id, notice_id: { not: null } },
    });

    if (likeListForNotice.length === 0) {
      logger.info("좋아요를 누른 공지사항이 없습니다.");
      return new Response(
        JSON.stringify({
          success: true,
          message: "좋아요를 누른 공지사항이 없습니다.",
        }),
        { status: 200 }, // OK
      );
    } else {
      // 공지사항 ID를 포함한 리스트 생성
      const serializedLikeList = likeListForNotice.map((like) => ({
        notice_id: like.notice_id ? like.notice_id.toString() : null,
      }));
      // const filteredLikeList = likeListForNotice.filter(
      //   (like) => like.notice_id
      // );
      logger.info(`사용자 ID ${token.id}의 좋아요 리스트 생성 성공`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "좋아요 목록 조회 성공",
          data: serializedLikeList,
        }),
        { status: 200 },
      ); // OK
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error("좋아요 리스트 처리 중 오류 발생: " + error.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "내부 서버 오류",
          message: error.message,
        }),
        { status: 500 }, // Internal Server Error
      );
    }
  }
}

/************************************************************************************************************\



/**
 * 인플루언서에 대한 좋아요 생성 및 제거 처리 함수
 * 이 함수는 사용자가 특정 인플루언서에 대해 좋아요를 표시하거나 제거하는 요청을 처리합니다. 요청된 인플루언서 ID에 대해 사용자의 좋아요가 이미 존재하는 경우 좋아요를 제거하고, 존재하지 않는 경우 좋아요를 생성합니다.
 *
 * @param {CreateLikeInfluencerData} req 요청 객체. 인플루언서 ID 및 기타 필요 데이터를 포함합니다.
 * @param {Token} token 사용자 토큰. 사용자 ID를 추출하기 위해 사용됩니다.
 * @returns {Response} 인플루언서에 대한 좋아요 생성 및 제거 결과에 대한 응답.
 *                     해당 인플루언서가 존재하지 않는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     이미 좋아요가 존재하는 경우 좋아요 제거 후 200(OK) 상태 코드와 메시지 반환.
 *                     좋아요 생성 성공 시 201(Created) 상태 코드와 생성된 좋아요 정보 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 인플루언서의 존재 여부 확인.
 * 2. 사용자의 기존 좋아요 여부 확인.
 * 3. 좋아요 존재 시 제거 및 disabled 설정, 없을 경우 생성 및 disabled 해제.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */

export async function createLikeInfluencer(
  req: CreateLikeInfluencerData,
  token: Token,
) {
  try {
    // 인플루언서 존재 여부 확인
    const influencerExists = await prisma.influencer.findUnique({
      where: { id: req.influencer_id },
    });

    if (!influencerExists) {
      logger.error(
        `ID ${req.influencer_id}에 해당하는 인플루언서를 찾을 수 없습니다.`,
      );
      return new Response(
        JSON.stringify({ error: "해당 인플루언서를 찾을 수 없습니다." }),
        { status: 404 }, // Not Found
      );
    }

    // 중복 좋아요 확인
    const existingLike = await prisma.like.findFirst({
      where: {
        influencer_id: req.influencer_id,
        user_id: token.id,
      },
    });

    if (existingLike) {
      // 이미 좋아요가 있다면 삭제
      await prisma.like.update({
        where: { id: existingLike.id },
        data: {
          influencer_id: null,
          disabled: true,
        },
      }),
        logger.info(`ID ${req.influencer_id}에 대한 좋아요가 제거되었습니다.`);
      return new Response(
        JSON.stringify({ message: "좋아요가 제거되었습니다.", disabled: true }),
        { status: 200 }, // OK
      );
    } else {
      // 좋아요 생성
      const newLike = await prisma.like.create({
        data: {
          influencer_id: req.influencer_id,
          user_id: token.id,
          disabled: false,
        },
      });

      const serializedLike = {
        id: newLike.id.toString(),
        influencer_id: newLike.influencer_id?.toString(),
        disabled: newLike.disabled,
      };

      logger.info(`ID ${req.influencer_id} 좋아요 생성 성공`);
      return new Response(JSON.stringify(serializedLike), { status: 201 }); // Created
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error("좋아요 처리 중 오류 발생: " + error.message);
      return new Response(
        JSON.stringify({ error: "내부 서버 오류", message: error.message }),
        { status: 500 }, // Internal Server Error
      );
    }
  }
}

/************************************************************************************************************\

/**
 * 사용자가 좋아요를 누른 인플루언서 목록 조회 함수
 * 이 함수는 특정 사용자가 좋아요를 누른 인플루언서 목록을 조회합니다. 사용자 토큰을 이용해 해당 사용자의 좋아요 목록을 조회하고, 해당하는 인플루언서 ID들을 반환합니다.
 *
 * @param {Token} token 사용자 토큰. 사용자 ID를 추출하기 위해 사용됩니다.
 * @returns {Response} 사용자가 좋아요를 누른 인플루언서 목록에 대한 응답.
 *                     좋아요를 누른 인플루언서 없는 경우 204(No Content) 상태 코드와 메시지 반환.
 *                     좋아요를 누른 인플루언서 목록 조회 성공 시 200(OK) 상태 코드와 인플루언서 ID 목록 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자 ID를 이용하여 좋아요 목록 조회.
 * 2. 좋아요 목록이 비어 있을 경우 204 상태 코드 반환.
 * 3. 좋아요 목록이 존재할 경우 인플루언서 ID 목록 생성 및 반환.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function getLikeListForInfluencer(token: Token) {
  try {
    // 사용자가 좋아요를 누른 인플루언서 목록 조회
    const likeListForInfluencer = await prisma.like.findMany({
      where: { user_id: token.id, influencer_id: { not: null } },
    });

    if (likeListForInfluencer.length === 0) {
      logger.info("좋아요를 누른 인플루언서가 없습니다.");
      return new Response(
        JSON.stringify({
          success: true,
          message: "좋아요를 누른 인플루언서가 없습니다.",
        }),
        { status: 200 }, // OK
      );
    } else {
      // 인플루언서 ID를 포함한 리스트 생성
      const serializedLikeList = likeListForInfluencer.map((like) => ({
        influencer_id: like.influencer_id
          ? like.influencer_id.toString()
          : null,
      }));

      logger.info(`사용자 ID ${token.id}의 좋아요 리스트 생성 성공`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "좋아요 목록 조회 성공",
          data: serializedLikeList,
        }),
        { status: 200 },
      ); // OK
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error("좋아요 리스트 처리 중 오류 발생: " + error.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "내부 서버 오류",
          message: error.message,
        }),
        { status: 500 }, // Internal Server Error
      );
    }
  }
}
/************************************************************************************************************\
 


/**
 * 상점에 대한 좋아요 생성 및 제거 처리 함수
 * 이 함수는 사용자가 특정 상점에 대해 좋아요를 표시하거나 제거하는 요청을 처리합니다. 요청된 상점 ID에 대해 사용자의 좋아요가 이미 존재하는 경우 좋아요를 제거하고, 존재하지 않는 경우 좋아요를 생성합니다.
 *
 * @param {CreateLikeStoreData} req 요청 객체. 상점 ID 및 기타 필요 데이터를 포함합니다.
 * @param {Token} token 사용자 토큰. 사용자 ID를 추출하기 위해 사용됩니다.
 * @returns {Response} 상점에 대한 좋아요 생성 및 제거 결과에 대한 응답.
 *                     해당 상점이 존재하지 않는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     이미 좋아요가 존재하는 경우 좋아요 제거 후 200(OK) 상태 코드와 메시지 반환.
 *                     좋아요 생성 성공 시 201(Created) 상태 코드와 생성된 좋아요 정보 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 상점의 존재 여부 확인.
 * 2. 사용자의 기존 좋아요 여부 확인.
 * 3. 좋아요 존재 시 제거 및 disabled 설정, 없을 경우 생성 및 disabled 해제.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function createLikeStore(req: CreateLikeStoreData, token: Token) {
  try {
    // 상점 존재 여부 확인
    const storeExists = await prisma.store.findUnique({
      where: { id: req.store_id },
    });

    if (!storeExists) {
      logger.error(`ID ${req.store_id}에 해당하는 상점을 찾을 수 없습니다.`);
      return new Response(
        JSON.stringify({ error: "해당 상점을 찾을 수 없습니다." }),
        { status: 404 }, // Not Found
      );
    }

    // 중복 좋아요 확인
    const existingLike = await prisma.like.findFirst({
      where: {
        store_id: req.store_id,
        user_id: token.id,
      },
    });

    if (existingLike) {
      // 이미 좋아요가 있다면 삭제
      await prisma.like.update({
        where: { id: existingLike.id },
        data: {
          store_id: null,
          disabled: true,
        },
      });
      logger.info(`ID ${req.store_id}에 대한 좋아요가 제거되었습니다.`);
      return new Response(
        JSON.stringify({ message: "좋아요가 제거되었습니다.", disabled: true }),
        { status: 200 }, // OK
      );
    } else {
      // 좋아요 생성
      const newLike = await prisma.like.create({
        data: {
          store_id: req.store_id,
          disabled: false,
          user_id: token.id,
        },
      });

      const serializedLike = {
        id: newLike.id.toString(),
        store_id: newLike.store_id?.toString(),
        disabled: newLike.disabled,
      };

      logger.info(`ID ${req.store_id} 좋아요 생성 성공`);
      return new Response(JSON.stringify(serializedLike), { status: 201 }); // Created
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error("좋아요 처리 중 오류 발생: " + error.message);
      return new Response(
        JSON.stringify({ error: "내부 서버 오류", message: error.message }),
        { status: 500 }, // Internal Server Error
      );
    }
  }
}

/************************************************************************************************************\
 
/**
 * 사용자가 좋아요를 누른 가계 목록 조회 함수
 * 이 함수는 특정 사용자가 좋아요를 누른 가계 목록을 조회합니다. 사용자 토큰을 이용해 해당 사용자의 좋아요 목록을 조회하고, 해당하는 가계 ID들을 반환합니다.
 *
 * @param {Token} token 사용자 토큰. 사용자 ID를 추출하기 위해 사용됩니다.
 * @returns {Response} 사용자가 좋아요를 누른 가계 목록에 대한 응답.
 *                     좋아요를 누른 가계 없는 경우 204(No Content) 상태 코드와 메시지 반환.
 *                     좋아요를 누른 가계 목록 조회 성공 시 200(OK) 상태 코드와 가계 ID 목록 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자 ID를 이용하여 좋아요 목록 조회.
 * 2. 좋아요 목록이 비어 있을 경우 204 상태 코드 반환.
 * 3. 좋아요 목록이 존재할 경우 가계 ID 목록 생성 및 반환.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function getLikeListForStore(token: Token) {
  try {
    // 사용자가 좋아요를 누른 가계 목록 조회
    const getLikeListForStore = await prisma.like.findMany({
      where: { user_id: token.id, store_id: { not: null } },
    });
    // console.log("getLikeListForStore :", getLikeListForStore);
    if (getLikeListForStore.length === 0) {
      logger.info("좋아요를 누른 가게가 없습니다.");
      return new Response(
        JSON.stringify({
          success: true,
          message: "좋아요를 누른 가게가 없습니다.",
        }),
        { status: 200 }, // OK
      );
    } else {
      console.log("getLikeListForStore :", getLikeListForStore);
      // 가게 ID를 포함한 리스트 생성
      const serializedLikeList = getLikeListForStore.map((like) => ({
        store_id: like.store_id ? like.store_id.toString() : null,
      }));

      logger.info(`사용자 ID ${token.id}의 좋아요 리스트 생성 성공`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "좋아요 목록 조회 성공",
          data: serializedLikeList,
        }),
        { status: 200 },
      ); // OK
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error("좋아요 리스트 처리 중 오류 발생: " + error.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "내부 서버 오류",
          message: error.message,
        }),
        { status: 500 }, // Internal Server Error
      );
    }
  }
}
/************************************************************************************************************\ 

/**
 * 맴버쉽 대한 좋아요 생성 및 제거 처리 함수
 * 이 함수는 사용자가 특정 맴버쉽에 대해 좋아요를 표시하거나 제거하는 요청을 처리합니다. 요청된 맴버쉽 ID에 대해 사용자의 좋아요가 이미 존재하는 경우 좋아요를 제거하고, 존재하지 않는 경우 좋아요를 생성합니다.
 *
 * @param {CreateLikeMembershipData} req 요청 객체. 맴버쉽 ID 및 기타 필요 데이터를 포함합니다.
 * @param {Token} token 사용자 토큰. 사용자 ID를 추출하기 위해 사용됩니다.
 * @returns {Response} 맴버쉽 대한 좋아요 생성 및 제거 결과에 대한 응답.
 *                     해당 맴버쉽이 존재하지 않는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     이미 좋아요가 존재하는 경우 좋아요 제거 후 200(OK) 상태 코드와 메시지 반환.
 *                     좋아요 생성 성공 시 201(Created) 상태 코드와 생성된 좋아요 정보 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 맴버쉽 존재 여부 확인.
 * 2. 사용자의 기존 좋아요 여부 확인.
 * 3. 좋아요 존재 시 제거 및 disabled 설정, 없을 경우 생성 및 disabled 해제.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */

export async function CreateLikeMembership(
  req: CreateLikeMembershipData,
  token: Token,
) {
  try {
    // 맴버쉽 존재 여부 확인
    // console.log("token inService:", token);
    const membershipExists = await prisma.membership.findUnique({
      where: { Id: req.membership_id },
    });

    if (!membershipExists) {
      logger.error(
        `ID ${req.membership_id}에 해당하는 맴버쉽을 찾을 수 없습니다.`,
      );
      return new Response(
        JSON.stringify({ error: "해당 맴버쉽을 찾을 수 없습니다." }),
        { status: 404 }, // Not Found
      );
    }

    // 중복 좋아요 확인
    const existingLike = await prisma.like.findFirst({
      where: {
        membership_id: req.membership_id,
        user_id: token.id,
      },
    });

    if (existingLike) {
      // 이미 좋아요가 있다면 삭제 및 disabled 설정
      await prisma.like.update({
        where: { id: existingLike.id },
        data: {
          membership_id: null,
          disabled: true,
        },
      });
      logger.info(`ID ${req.membership_id}에 대한 좋아요가 제거되었습니다.`);
      return new Response(
        JSON.stringify({ message: "좋아요가 제거되었습니다.", disabled: true }),
        { status: 200 }, // OK
      );
    } else {
      // 좋아요 생성 및 disabled 해제
      const newLike = await prisma.like.create({
        data: {
          membership_id: req.membership_id,
          user_id: token.id,
          disabled: false,
        },
      });

      const serializedLike = {
        id: newLike.id.toString(),
        membership_id: newLike.membership_id!.toString(),
        disabled: newLike.disabled,
      };

      logger.info(`${req.membership_id} 좋아요 생성 성공`);
      return new Response(JSON.stringify(serializedLike), { status: 201 }); // Created
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error("좋아요 처리 중 오류 발생: " + error.message);
      return new Response(
        JSON.stringify({ error: "내부 서버 오류", message: error.message }),
        { status: 500 }, // Internal Server Error
      );
    }
  }
}

/************************************************************************************************************\
/**
 * 사용자가 좋아요를 누른 맴버쉽 목록 조회 함수
 * 이 함수는 특정 사용자가 좋아요를 누른 맴버쉽 목록을 조회합니다. 사용자 토큰을 이용해 해당 사용자의 좋아요 목록을 조회하고, 해당하는 맴버쉽 ID들을 반환합니다.
 *
 * @param {Token} token 사용자 토큰. 사용자 ID를 추출하기 위해 사용됩니다.
 * @returns {Response} 사용자가 좋아요를 누른 맴버쉽 목록에 대한 응답.
 *                     좋아요를 누른 맴버쉽 없는 경우 204(No Content) 상태 코드와 메시지 반환.
 *                     좋아요를 누른 맴버쉽 목록 조회 성공 시 200(OK) 상태 코드와 맴버쉽 ID 목록 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자 ID를 이용하여 좋아요 목록 조회.
 * 2. 좋아요 목록이 비어 있을 경우 204 상태 코드 반환.
 * 3. 좋아요 목록이 존재할 경우 맴버쉽 ID 목록 생성 및 반환.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function getLikeListForMembership(token: Token) {
  try {
    // 사용자가 좋아요를 누른 맴버쉽 목록 조회
    const likeListForMembership = await prisma.like.findMany({
      where: { user_id: token.id, membership_id: { not: null } },
    });

    if (likeListForMembership.length === 0) {
      logger.info("좋아요를 누른 맴버쉽이 없습니다.");
      return new Response(
        JSON.stringify({
          success: true,
          message: "좋아요를 누른 맴버쉽이 없습니다.",
        }),
        { status: 200 }, // OK
      );
    } else {
      // 맴버쉽 ID를 포함한 리스트 생성
      const serializedLikeList = likeListForMembership.map((like) => ({
        membership_id: like.membership_id
          ? like.membership_id.toString()
          : null,
      }));
      // const filteredLikeList = likeListForMembership.filter(
      //   (like) => like.membership_id
      // );
      logger.info(`사용자 ID ${token.id}의 좋아요 리스트 생성 성공`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "좋아요 목록 조회 성공",
          data: serializedLikeList,
        }),
        { status: 200 },
      ); // OK
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error("좋아요 리스트 처리 중 오류 발생: " + error.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "내부 서버 오류",
          message: error.message,
        }),
        { status: 500 }, // Internal Server Error
      );
    }
  }
}

/************************************************************************************************************\


/**
 * Store 좋아요를 삭제하는 함수
 *
 * @param {Object} req 요청 객체
 * @param {Object} token 토큰 객체
 * @returns {Response} 삭제된 좋아요에 대한 응답
 */

// export async function removeStoreLike(
//   req: RemoveStoreLikeRequest,
//   token: Token,
//   data: RemoveStoreLikeData
// ) {
//   try {
//     // Notice 좋아요 찾기
//     const currentStoreLike = await prisma.like.findFirst({
//       where: {
//         store_id: req.store_id,
//         user_id: token.id,
//       },
//     });

//     // 해당 좋아요가 존재하지 않는 경우
//     if (!currentStoreLike) {
//       logger.error("해당 좋아요가 존재하지 않습니다.");
//       return new Response(
//         JSON.stringify({ error: "좋아요가 존재하지 않습니다." }),
//         { status: 404 } // Not Found 상태 코드å
//       );
//     }

//     // 좋아요 비활성화 (disabled 상태로 변경)
//     const updatedNotice = await prisma.like.update({
//       where: { id: currentStoreLike.id },
//       data: {
//         disabled: true,
//       },
//     });

//     logger.info(`${req.store_id} 좋아요 삭제 성공`);
//     return new Response(JSON.stringify({ message: "좋아요 삭제 성공" }), {
//       status: 200,
//     });
//   } catch (error) {
//     if (error instanceof Error) {
//       logger.error("좋아요 삭제 처리 중 오류 발생: " + error.message);
//       return new Response(JSON.stringify({ error: "내부 서버 오류" }), {
//         status: 500,
//       });
//     }
//   }
// }

/************************************************************************************************************/
/**
 * 공지사항 좋아요를 삭제하는 함수
 *
 * @param {Object} req 요청 객체
 * @param {Object} token 토큰 객체
 * @returns {Response} 삭제된 좋아요에 대한 응답
 */

// export async function removeNoticeLike(
//   req: RemoveNoticeLikeRequest,
//   token: Token,
//   data: RemoveNoticeLikeData
// ) {
//   try {
//     // Notice 좋아요 찾기
//     const currentNoticeLike = await prisma.like.findFirst({
//       where: {
//         notice_id: req.notice_id,
//         user_id: token.id,
//       },
//     });

//     // 해당 좋아요가 존재하지 않는 경우
//     if (!currentNoticeLike) {
//       logger.error("해당 좋아요가 존재하지 않습니다.");
//       return new Response(
//         JSON.stringify({ error: "좋아요가 존재하지 않습니다." }),
//         { status: 404 } // Not Found 상태 코드å
//       );
//     }

//     // 좋아요 비활성화 (disabled 상태로 변경)
//     const updatedNotice = await prisma.like.update({
//       where: { id: currentNoticeLike.id },
//       data: {
//         disabled: true,
//       },
//     });

//     logger.info(`${req.notice_id} 좋아요 삭제 성공`);
//     return new Response(JSON.stringify({ message: "좋아요 삭제 성공" }), {
//       status: 200,
//     });
//   } catch (error) {
//     if (error instanceof Error) {
//       logger.error("좋아요 삭제 처리 중 오류 발생: " + error.message);
//       return new Response(JSON.stringify({ error: "내부 서버 오류" }), {
//         status: 500,
//       });
//     }
//   }
// }

/************************************************************************************************************/

/**
 * 인플루언서 좋아요를 삭제하는 함수
 *
 * @param {Object} req 요청 객체
 * @param {Object} token 토큰 객체
 * @returns {Response} 삭제된 좋아요에 대한 응답
 */

// export async function removeInfluencerLike(
//   req: RemoveInfluencerLikeRequest,
//   token: Token,
//   data: RemoveInfluencerLikeData
// ) {
//   try {
//     // Notice 좋아요 찾기
//     const currentInfluencerLike = await prisma.like.findFirst({
//       where: {
//         influencer_id: req.influencer_id,
//         user_id: token.id,
//       },
//     });

//     // 해당 좋아요가 존재하지 않는 경우
//     if (!currentInfluencerLike) {
//       logger.error("해당 좋아요가 존재하지 않습니다.");
//       return new Response(
//         JSON.stringify({ error: "좋아요가 존재하지 않습니다." }),
//         { status: 404 } // Not Found 상태 코드å
//       );
//     }

//     // 좋아요 비활성화 (disabled 상태로 변경)
//     const updatedNotice = await prisma.like.update({
//       where: { id: currentInfluencerLike.id },
//       data: {
//         disabled: true,
//       },
//     });
//     logger.info(`${req.influencer_id} 좋아요 삭제 성공`);
//     return new Response(JSON.stringify({ message: "좋아요 삭제 성공" }), {
//       status: 200,
//     });
//   } catch (error) {
//     if (error instanceof Error) {
//       logger.error("좋아요 삭제 처리 중 오류 발생: " + error.message);
//       return new Response(JSON.stringify({ error: "내부 서버 오류" }), {
//         status: 500,
//       });
//     }
//   }
// }

/************************************************************************************************************\

// /**
//  * 사용자의 좋아요 리스트를 조회하는 함수
//  *
//  * @param {Object} req 요청 객체
//  * @returns {Response} 좋아요 리스트에 대한 응답
//  */
// export async function getLikeUserList(req: any) {
//   try {
//     const likesList = await prisma.like.findMany({
//       where: {
//         user_id: req.user_id,
//       },
//     });

//     const serializedLikeList = likesList.map((likesList) => ({
//       id: likesList!.id.toString(),
//     }));
//     console.debug("New LikeList:", serializedLikeList);
//     logger.info(`${req.user_id} 좋아요 리스트 생성 성공`);
//     return new Response(JSON.stringify(serializedLikeList), { status: 201 });
//   } catch (error) {
//     if (error instanceof Error) {
//       logger.error("좋아요 리스트 처리 중 오류 발생: " + error.message);
//       console.error("New LikeList error:", error.message);
//       return new Response(JSON.stringify({ error: "내부 서버 오류" }), {
//         status: 500,
//       });
//     }
//   }
// }
