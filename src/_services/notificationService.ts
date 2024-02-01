import { Identifier } from "./../../node_modules/acorn/dist/acorn.d";
import { PrismaClient } from "@prisma/client";
import {
  NotifyMembershipForStoreRequest,
  NotifyMembershipForInfluencerRequest,
  NotifyForNoticesRequest,
  Token,
  Notification,
} from "@/types/interface/notification_Interface";
import Logger from "@/src/middleware/logger";
const prisma = new PrismaClient();
const logger = new Logger("logs");

/**
 * 사용자에게 새로운 멤버십 알림 생성 함수
 * 이 함수는 사용자가 구독한 스토어에서 생성된 새 멤버십에 대한 알림을 생성합니다. 사용자의 알림 설정과 구독 정보를 확인하고,
 * 최근 생성된 멤버십에 대해 알림을 생성합니다. 사용자의 알림 설정이 꺼져 있거나, 새 멤버십이 없는 경우, 적절한 메시지와 함께 응답합니다.
 *
 * @param {Object} token 사용자 토큰.
 * @returns {Response} 멤버십 알림 생성 결과에 대한 응답.
 *                     사용자의 알림 설정이 꺼져 있으면 200(OK) 상태 코드와 '알림 설정이 꺼져 있습니다.' 메시지 반환.
 *                     새 멤버십이 없으면 200(OK) 상태 코드와 '새 멤버십이 없습니다.' 메시지 반환.
 *                     알림 생성 성공 시 201(Created) 상태 코드와 생성된 알림 목록 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자 알림 설정 확인.
 * 2. 사용자 구독 목록 조회 및 유효한 스토어 ID 추출.
 * 3. 최근 생성된 멤버십 조회.
 * 4. 새 멤버십에 대한 알림 생성 및 직렬화.
 * 5. 알림 생성 결과에 따른 적절한 응답 반환.
 */
export async function notifyMembershipForStore(token: any) {
  try {
    // 토큰에서 사용자 ID 추출
    const userId = token.id;

    // 사용자의 알림 설정 조회
    const userSetting = await prisma.user_setting.findFirst({
      where: { user_Id: userId },
      select: { notify: true },
    });

    // 사용자의 알림 설정이 꺼져있으면 처리 중단
    if (userSetting!.notify === "OFF") {
      return new Response(
        JSON.stringify({ message: "알림 설정이 꺼져 있습니다." }),
        { status: 200 }
      );
    }

    // 현재 날짜 및 시간 설정
    const currentDate = new Date();
    // 사용자가 구독한 스토어 목록 조회
    const subscriptions = await prisma.subscription.findMany({
      where: {
        user_Id: userId,
        store_deactivate: false,
      },
      select: { store_Id: true },
    });

    // 구독한 스토어 ID를 배열로 추출하고 null 값 제거
    const storeIds = subscriptions
      .map((sub) => sub.store_Id)
      .filter((id): id is bigint => id !== null);

    // 사용자가 구독한 스토어의 새 멤버십을 조회
    const newMemberships = await prisma.membership.findMany({
      where: {
        store_Id: { in: storeIds },
        CreateDate: {
          gte: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000),
        },
      },
      include: { store: true },
    });

    // 생성될 알림을 저장할 배열 초기화
    let notificationsCreated = [];

    // 각 새 멤버십에 대해 알림 생성
    for (const membership of newMemberships) {
      // 멤버십 상세 정보 생성
      const membershipDetails = `제목: ${membership.subject}, 설명: ${membership.description}`;
      // 새 알림 생성
      const newNotification = await prisma.notification.create({
        data: {
          user_Id: userId,
          title: "새 멤버십 알림",
          message: `구독한 스토어 ${membership.store?.name}에서 새 멤버십이 생성되었습니다. 멤버십 정보: ${membershipDetails}`,
          store_Id: membership.store_Id,
        },
      });

      // 생성된 알림을 배열에 추가
      notificationsCreated.push(newNotification);
    }
    // 생성된 알림이 있는 경우 응답 반환
    if (notificationsCreated.length > 0) {
      return new Response(
        JSON.stringify({ notifications: notificationsCreated }),
        { status: 201 }
      );
    } else {
      return new Response(
        JSON.stringify({ message: "새 멤버십이 없습니다." }),
        { status: 200 }
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({ error: "내부 서버 오류", message: error.message }),
        { status: 500 }
      );
    }
  }
}

/************************************************************************************************************/

/**
 * 사용자에게 인플루언서의 새 멤버십 알림 생성 함수
 * 이 함수는 사용자가 구독한 인플루언서에서 생성된 새 멤버십에 대한 알림을 생성합니다. 사용자의 알림 설정을 확인하고,
 * 구독한 인플루언서의 최근 멤버십에 대해 알림을 생성합니다. 사용자의 알림 설정이 꺼져 있거나, 새 멤버십이 없는 경우, 적절한 메시지와 함께 응답합니다.
 *
 * @param {Object} token 사용자 토큰.
 * @returns {Response} 멤버십 알림 생성 결과에 대한 응답.
 *                     사용자의 알림 설정이 꺼져 있으면 200(OK) 상태 코드와 '알림 설정이 꺼져 있습니다.' 메시지 반환.
 *                     새 멤버십이 없으면 200(OK) 상태 코드와 '새 멤버십이 없습니다.' 메시지 반환.
 *                     알림 생성 성공 시 201(Created) 상태 코드와 생성된 알림 목록 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자 알림 설정 확인.
 * 2. 사용자 구독 목록 조회 및 유효한 인플루언서 ID 추출.
 * 3. 최근 생성된 멤버십 조회.
 * 4. 새 멤버십에 대한 알림 생성 및 직렬화.
 * 5. 알림 생성 결과에 따른 적절한 응답 반환.
 */
export async function notifyMembershipForInfluencer(token: any) {
  try {
    // 토큰에서 사용자 ID 추출
    const userId = token.id;

    // 사용자의 알림 설정 조회
    const userSetting = await prisma.user_setting.findFirst({
      where: { user_Id: userId },
      select: { notify: true },
    });

    // 알림 설정이 OFF인 경우 알림 발송을 중단하고 응답 반환
    if (userSetting?.notify === "OFF") {
      return new Response(
        JSON.stringify({ message: "알림 설정이 꺼져 있습니다." }),
        { status: 200 }
      );
    }

    // 현재 날짜와 시간을 설정
    const currentDate = new Date();

    // 사용자가 구독한 인플루언서 목록을 조회
    const subscriptions = await prisma.subscription.findMany({
      where: {
        user_Id: userId,
        influencer_deactivate: false,
      },
      select: { influencer_Id: true },
    });

    // 구독한 인플루언서의 ID를 배열로 추출
    const influencerIds = subscriptions
      .map((sub) => sub.influencer_Id)
      .filter((id): id is bigint => id !== null);

    // 사용자가 구독한 인플루언서의 새 멤버십을 조회
    const newMemberships = await prisma.membership.findMany({
      where: {
        influencer_Id: { in: influencerIds },
        CreateDate: {
          gte: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000),
        },
      },
      include: { Influencer: true },
    });

    // 알림을 저장할 배열 초기화
    let notificationsCreated = [];

    // 각 새 멤버십에 대한 알림을 생성
    for (const membership of newMemberships) {
      const membershipDetails = `제목: ${membership.subject}, 설명: ${membership.description}`;
      const newNotification = await prisma.notification.create({
        data: {
          user_Id: userId,
          title: "새 멤버십 알림",
          message: `구독한 인플루언서 ${membership.influencer_Id}가 새 멤버십을 생성했습니다. 멤버십 정보: ${membershipDetails}`,
          influencer_Id: membership.influencer_Id,
        },
      });
      notificationsCreated.push(newNotification);
    }

    // 생성된 알림이 있으면 해당 알림을 응답으로 반환
    if (notificationsCreated.length > 0) {
      return new Response(
        JSON.stringify({ notifications: notificationsCreated }),
        { status: 201 }
      );
    } else {
      // 새 멤버십이 없는 경우 해당 메시지를 응답으로 반환
      return new Response(
        JSON.stringify({ message: "새 멤버십이 없습니다." }),
        { status: 200 }
      );
    }
  } catch (error) {
    // 오류 처리: 오류 발생 시 오류 메시지와 함께 500 상태 코드 반환
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({ error: "내부 서버 오류", message: error.message }),
        { status: 500 }
      );
    }
  }
}

/************************************************************************************************************/

/**
 * 사용자에게 새로운 공지사항에 대한 알림 생성 함수
 * 이 함수는 사용자에게 최근 24시간 이내에 생성된 공개된 공지사항에 대한 알림을 생성합니다.
 * 사용자 ID를 기반으로 새 공지사항을 조회하고, 해당 공지사항에 대한 알림을 생성합니다.
 *
 * @param {Object} token 사용자 토큰. 사용자의 ID 및 기타 정보가 포함됩니다.
 * @returns {Response} 공지사항 알림 생성 결과에 대한 응답.
 *                     새 공지사항이 있으면 201(Created) 상태 코드와 생성된 알림 목록 반환.
 *                     새 공지사항이 없으면 200(OK) 상태 코드와 '새 공지사항이 없습니다.' 메시지 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 토큰에서 사용자 ID 추출.
 * 2. 최근 24시간 이내에 생성된 공개된 공지사항 조회.
 * 3. 각 공지사항에 대해 새 알림 객체 생성 및 저장.
 * 4. 생성된 알림이 있으면 해당 알림 목록을 반환, 없으면 적절한 메시지 반환.
 * 5. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */

export async function notifyForNotices(token: Token) {
  try {
    // 토큰에서 사용자 ID 추출
    const userId = token.id;

    // 현재 날짜와 시간 설정
    const currentDate = new Date();

    // 최근 24시간 이내에 생성된 공개된 공지사항 조회
    const newNotices = await prisma.notices.findMany({
      where: {
        status: "PUBLIC",
        CreateDate: {
          gte: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000),
        },
      },
    });

    // 생성된 알림을 저장할 배열 초기화
    let notificationsCreated = [];

    // 각 새 공지사항에 대해 알림 생성
    for (const notice of newNotices) {
      // 새 알림 객체 생성
      const newNotification = await prisma.notification.create({
        data: {
          user_Id: userId, // 알림을 받을 사용자 ID
          title: "공지사항", // 알림 제목
          message: "새로운 공지 사항이 있어요", // 알림 메시지
        },
      });

      // 생성된 알림을 배열에 추가
      notificationsCreated.push(newNotification);
    }

    // 생성된 알림이 있는 경우 응답 반환
    if (notificationsCreated.length > 0) {
      // 생성된 알림 목록을 포함한 응답 반환
      return new Response(
        JSON.stringify({ notifications: notificationsCreated }),
        { status: 201 }
      );
    } else {
      // 새 공지사항이 없는 경우 메시지를 포함한 응답 반환
      return new Response(
        JSON.stringify({ message: "새 공지사항이 없습니다." }),
        { status: 200 }
      );
    }
  } catch (error) {
    // 오류 처리
    if (error instanceof Error) {
      // 오류 메시지와 함께 500 상태 코드 반환
      return new Response(
        JSON.stringify({ error: "내부 서버 오류", message: error.message }),
        { status: 500 }
      );
    }
  }
}

/************************************************************************************************************/

/************************************************************************************************************/

// /**
//  * 새로운 Membership 및 Notice 알림 생성 함수
//  * 이 함수는 사용자가 구독한 스토어,인플루언서에서 새로운 멤버십이나 공지사항이 생성되었을 때 해당 사용자에게 알림을 생성합니다.
//  *
//  * @param {Object} req 요청 객체. 여기서는 사용되지 않으나, 확장성을 위해 포함됩니다.
//  * @param {Object} token 토큰 객체. 사용자 ID를 추출하기 위해 사용됩니다.
//  * @returns {Response} 알림 생성에 대한 응답.
//  *                     새 멤버십이나 공지사항이 있으면 201 상태 코드와 함께 성공 메시지를 반환하고,
//  *                     새 멤버십이나 공지사항이 없으면 200 상태 코드와 함께 메시지를 반환합니다.
//  *                     오류가 발생한 경우, 500 상태 코드와 함께 오류 메시지를 반환합니다.
//  */

// export async function createNotifications(
//   req: createNotificationRequest,
//   token: any
// ) {
//   try {
//     const userId = token.id; // 토큰에서 사용자 ID 추출
//     const currentDate = new Date(); // 현재 날짜와 시간

//     // 사용자가 구독한 스토어 및 인플루언서 목록을 가져옵니다.
//     const subscriptions = await prisma.subscription.findMany({
//       where: {
//         user_Id: userId,
//         store_deactivate: false,
//       },
//       select: {
//         store_Id: true,
//         influencer_Id: true,
//       },
//     });

//     let notifications_Created: notification[] = []; // 생성된 알림들을 저장할 배열

//     // 구독된 스토어 및 인플루언서에 대해 새 멤버십과 공지사항이 있는지 확인
//     for (const subscription of subscriptions) {
//       // 새 멤버십 확인
//       const newMemberships = await prisma.membership.findMany({
//         where: {
//           OR: [
//             { store_Id: subscription.store_Id },
//             { influencer_Id: subscription.influencer_Id },
//           ],
//           CreateDate: {
//             gte: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000), // 최근 24시간 이내에 생성된 멤버십
//           },
//         },
//       });

//       // 새 공지사항 확인
//       const newNotices = await prisma.notices.findMany({
//         where: {
//           CreateDate: {
//             gte: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000), // 최근 24시간 이내에 생성된 공지사항
//           },
//         },
//       });

//       // 새 멤버십 및 공지사항에 대한 알림 생성
//       for (const item of [...newMemberships, ...newNotices]) {
//         let title, message;

//         if ("store_Id" in item) {
//           // item이 멤버십 객체인 경우
//           title = "새 멤버십 알림";
//           message = `구독한 스토어 ${item.store_Id}에서 새 멤버십이 생성되었습니다.`;
//         } else {
//           // item이 공지사항 객체인 경우
//           title = "새 공지사항 알림";
//           message = `새 공지사항: ${item.subject}`;
//         }

//         const newNotification = await prisma.notification.create({
//           data: {
//             user_Id: userId,
//             title,
//             message,
//             // 다른 필드들...
//           },
//         });
//         notifications_Created.push(newNotification);
//       }
//     }

//     if (notifications_Created.length > 0) {
//       logger.info("새로운 알림이 성공적으로 생성되었습니다.");
//       return new Response(
//         JSON.stringify({ notifications: notifications_Created }),
//         { status: 201 }
//       );
//     } else {
//       return new Response(
//         JSON.stringify({ message: "새 멤버십이나 공지사항이 없습니다." }),
//         { status: 200 }
//       );
//     }
//   } catch (error) {
//     if (error instanceof Error) {
//       logger.error("새로운 알림 생성 중 오류 발생: " + error.message);
//       return new Response(
//         JSON.stringify({ error: "내부 서버 오류", message: error.message }),
//         { status: 500 }
//       );
//     }
//   }
// }
