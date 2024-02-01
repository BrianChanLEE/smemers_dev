import { PrismaClient } from "@prisma/client";
import Logger from "@/src/middleware/logger";
import { createMembershipRequest } from "@/types/interface/membership_Interface";

const prisma = new PrismaClient();
const logger = new Logger("logs");

/**
 * 사용자 멤버십 생성 처리 함수
 * 이 함수는 사용자의 멤버십 생성 요청을 처리합니다. 사용자가 제공한 데이터를 바탕으로 멤버십을 생성합니다.
 *
 * @param {createMembershipRequest} req 멤버십 생성 요청 객체. 멤버십 생성에 필요한 데이터를 포함합니다.
 * @param {Token} token 사용자의 인증 토큰. 사용자 인증과 권한 확인에 사용됩니다.
 * @returns {Response} 멤버십 생성 결과에 대한 응답.
 *                     인증되지 않은 회원일 경우 403(Forbidden) 상태 코드와 오류 메시지 반환.
 *                     멤버십 생성 성공 시 201(Created) 상태 코드와 생성된 멤버십 정보를 포함한 응답 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자의 인증 여부 및 권한 확인.
 * 2. 인증되지 않은 회원일 경우 적절한 응답 반환.
 * 3. 멤버십 데이터 생성 및 저장.
 * 4. 생성된 멤버십 데이터 직렬화 및 반환.
 * 5. 생성 중 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function createMembership(
  req: createMembershipRequest,
  token: any
) {
  logger.info("새로운 Membership 생성을 시작합니다.");

  try {
    // 스토어 또는 인플루언서 인증 여부 확인
    const storeOrInfluencer =
      (await prisma.store.findFirst({
        where: { user_id: token.id },
      })) ||
      (await prisma.influencer.findFirst({
        where: { user_id: token.id },
      }));
    console.log("storeOrInfluencer :", storeOrInfluencer);
    if (!storeOrInfluencer || storeOrInfluencer.enabled === false) {
      return new Response(
        JSON.stringify({
          error: "아직 인증되지 않은 회원입니다. 고객센터에 문의 바랍니다.",
        }),
        { status: 403 } // Forbidden
      );
    }

    // Membership 데이터 생성
    const newMembership = await prisma.membership.create({
      data: {
        image: req.image, // 이미지 URL
        subject: req.subject, // Membership 제목
        description: req.description, // 설명
        expiration_Period: new Date(req.expiration_Period), // 만료 기간
        discount_rate: req.discount_rate, // 할인율
        issuer: req.issuer, // 발행자
        store_Id: token.id, // 스토어 ID (토큰에서 추출)
        price: req.price, //가격
      },
    });

    // 생성된 Membership 데이터 직렬화
    const serializedMembership = {
      Id: newMembership.Id.toString(),
      image: newMembership.image,
      subject: newMembership.subject,
      description: newMembership.description,
      expiration_Period: newMembership.expiration_Period?.toISOString(),
      discount_rate: newMembership.discount_rate,
      issuer: newMembership.issuer,
      price: newMembership.price,
    };

    logger.info("새로운 Membership이 성공적으로 생성되었습니다.");
    return new Response(JSON.stringify(serializedMembership), { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("새로운 Membership 생성 중 오류 발생: " + error.message);
      return new Response(JSON.stringify({ error: "내부 서버 오류" }), {
        status: 500,
      });
    }
  }
}

/************************************************************************************************************/

/**
 * 모든 멤버십 조회 처리 함수
 * 이 함수는 시스템에 등록된 모든 멤버십을 조회하는 요청을 처리합니다.
 *
 * @returns {Response} 멤버십 조회 결과에 대한 응답.
 *                     조회된 멤버십이 없는 경우 204(No Content) 상태 코드와 오류 메시지 반환.
 *                     멤버십 조회 성공 시 200(OK) 상태 코드와 조회된 멤버십 목록을 포함한 응답 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 시스템에 등록된 모든 멤버십 조회.
 * 2. 조회된 멤버십이 없는 경우 적절한 응답 반환.
 * 3. 조회된 멤버십 데이터 직렬화 및 반환.
 * 4. 조회 중 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function getAllMembership() {
  logger.info("모든 Membership 조회를 시작합니다.");

  try {
    const memberships = await prisma.membership.findMany();
    logger.info("모든 Membership을 조회를 성공적으로 완료했습니다.");

    if (memberships.length === 0) {
      return new Response(
        JSON.stringify({ message: "조회할 Membership이 없습니다." }),
        { status: 204 } // No Content
      );
    }

    // 생성된 Membership 데이터 직렬화
    const serializedMemberships = memberships.map((membership) => ({
      Id: membership.Id.toString(),
      image: membership.image,
      subject: membership.subject,
      description: membership.description,
      expiration_Period: membership.expiration_Period!.toISOString(),
      discount_rate: membership.discount_rate,
      issuer: membership.issuer,
    }));

    return new Response(JSON.stringify(serializedMemberships), {
      status: 200, // OK
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Membership 조회 중 오류 발생: ${error.message}`);
      return new Response(
        JSON.stringify({ error: "내부 서버 오류", message: error.message }),
        { status: 500 } // Internal Server Error
      );
    }
  }
}

/************************************************************************************************************\
/**
 *   사용한 완료한 맴버쉽
 *
 * @param {Object} req 요청 객체
 * @param {Object} token 토큰 객체
 *
 * @returns {Response} 업데이트된 구독 정보에 대한 응답
 */
export async function updateMembershipUseYn(req: any, token: any, Id: any) {
  try {
    // 현재 보유중인 맴버쉽찾기
    const currentUseYn = await prisma.membership.findFirst({
      where: {
        user_Id: token.id,
        Id: req.Id,
      },
    });

    // 해당 맴버쉽을 보유하고 있지 않는 경우
    if (!currentUseYn) {
      logger.error("해당 맴버쉽을 찾지 못했습니다.");
      return new Response(
        JSON.stringify({ error: "해당 맴버쉽을 찾지 못했습니다." }),
        {
          status: 404, // Not Found 상태 코드
        }
      );
    }

    // 구독 정보 업데이트
    const updatedUseYn = await prisma.membership.update({
      where: {
        Id: currentUseYn.Id,
      },
      data: {
        UseYn: true,
      },
    });

    const serializeUpdatedUseYn = {
      Id: currentUseYn.Id.toString(),
      UseYn: currentUseYn.UseYn,
    };
    logger.info(`맴버쉽 업데이트 성공: ${updatedUseYn.Id}`);
    return new Response(JSON.stringify(serializeUpdatedUseYn), { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("맴버쉽 업데이트 중 오류 발생: " + error.message);
      return new Response(JSON.stringify({ error: "내부 서버 오류" }), {
        status: 500,
      });
    }
  }
}
