import { PrismaClient } from "@prisma/client";

import {
  bioAuthSettingRequest,
  notifySettingRequest,
} from "@/types/interface/userSetting_Interface";
import Logger from "@/src/middleware/logger";

const prisma = new PrismaClient();
const logger = new Logger("logs");

/**
 * 생체인증 설정 ON/OFF 함수
 * 이 함수는 사용자의 생체 인증 설정을 변경합니다. 요청을 통해 제공된 생체 인증 설정(ON/OFF)에 따라
 * 사용자의 생체 인증 설정합니다.
 *
 * @param {Object} req 요청 객체. 생체 인증 활성화 여부를 포함합니다.
 * @param {Object} token 토큰 객체. 사용자 ID를 추출하기 위해 사용됩니다.
 * @returns {Response} 처리 결과에 대한 응답.
 *                     생체 인증 설정이 성공적으로 업데이트되면 200 상태 코드와 함께 성공 메시지를 반환하고,
 *                     해당 사용자 설정을 찾을 수 없으면 404 상태 코드와 함께 오류 메시지를 반환합니다.
 *                     오류가 발생한 경우, 500 상태 코드와 함께 오류 메시지를 반환합니다.
 */

export async function bioAuthSetting(req: bioAuthSettingRequest, token: any) {
  try {
    const userId = token.id; // 토큰에서 사용자 ID 추출
    console.log("userId :", userId);
    // user_setting에서 사용자 설정 조회
    const existingSetting = await prisma.user_setting.findFirst({
      where: { user_Id: userId },
    });

    let setBioAuth;
    if (existingSetting) {
      // 기존 설정이 있는 경우, bio_Auth의 값을 반전시킴
      setBioAuth = await prisma.user_setting.update({
        where: { Id: existingSetting.Id },
        data: {
          user_Id: userId,
          bio_Auth: existingSetting.bio_Auth === "ON" ? "OFF" : "ON",
        },
      });
    } else {
      // 설정이 없는 경우, 새로운 설정을 생성
      setBioAuth = await prisma.user_setting.create({
        data: {
          user_Id: userId,
          bio_Auth: "ON",
        },
      });
    }

    logger.info(
      `사용자 ID ${userId}의 생체 인증 설정이 ${
        setBioAuth.bio_Auth === "ON" ? "켜짐" : "꺼짐"
      }으로 설정되었습니다.`
    );

    const serializedBioSet = {
      Id: setBioAuth.Id.toString(),
      bio_Auth: setBioAuth.bio_Auth,
    };

    // 성공적으로 설정된 경우
    return new Response(
      JSON.stringify({
        success: true,
        message: `생체 인증 설정이 ${
          setBioAuth.bio_Auth === "ON" ? "켜짐" : "꺼짐"
        }으로 설정됨`,
        serializedBioSet,
      }),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`생체 인증 설정 중 오류 발생: ${error.message}`, {
        errorStack: error.stack,
        userId: token.id,
      });
      return new Response(
        JSON.stringify({
          error: "내부 서버 오류",
          message: error.message,
        }),
        { status: 500 }
      );
    }
  }
}

/************************************************************************************************************/
/**
 * 알림 설정 ON/OFF 함수
 * 이 함수는 사용자의 알림 설정을 변경합니다. 요청을 통해 제공된 알림 설정(ON/OFF)에 따라
 * 사용자의 알림 설정을 업데이트합니다.
 *
 * @param {Object} req 요청 객체. 알림 활성화 여부를 포함합니다.
 * @param {Object} token 토큰 객체. 사용자 ID를 추출하기 위해 사용됩니다.
 * @returns {Response} 처리 결과에 대한 응답.
 *                     알림 설정이 성공적으로 업데이트되면 200 상태 코드와 함께 성공 메시지를 반환하고,
 *                     해당 사용자 설정을 찾을 수 없으면 404 상태 코드와 함께 오류 메시지를 반환합니다.
 *                     오류가 발생한 경우, 500 상태 코드와 함께 오류 메시지를 반환합니다.
 */
export async function notifySetting(req: notifySettingRequest, token: any) {
  try {
    const userId = token.id; // 토큰에서 사용자 ID 추출

    // user_setting에서 사용자 설정 조회
    const existingSetting = await prisma.user_setting.findFirst({
      where: { user_Id: userId },
    });

    let setNotify;
    if (existingSetting) {
      // 기존 설정이 있는 경우, 알림 설정을 반전
      setNotify = await prisma.user_setting.update({
        where: { Id: existingSetting.Id },
        data: { notify: existingSetting.notify === "ON" ? "OFF" : "ON" },
      });
    } else {
      // 설정이 없는 경우, 새로운 설정을 생성
      setNotify = await prisma.user_setting.create({
        data: { user_Id: userId, notify: "ON" },
      });
    }

    logger.info(
      `사용자 ID ${userId}의 알림 설정이 ${
        setNotify.notify === "ON" ? "켜짐" : "꺼짐"
      }으로 설정되었습니다.`
    );

    const serializednotifySet = {
      Id: setNotify.Id.toString(),
      user_Id: setNotify.user_Id?.toString(),
      notify: setNotify.notify,
    };

    // 성공적으로 설정된 경우
    return new Response(
      JSON.stringify({
        success: true,
        message: `알림 설정이 ${
          setNotify.notify === "ON" ? "켜짐" : "꺼짐"
        }으로 설정됨`,
        serializednotifySet,
      }),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`알림 설정 변경 중 오류 발생: ${error.message}`, {
        errorStack: error.stack,
        userId: token.id,
      });
      return new Response(
        JSON.stringify({
          error: "내부 서버 오류",
          message: error.message,
        }),
        { status: 500 }
      );
    }
  }
}

/************************************************************************************************************/

// export async function notifySetting(req: notifySettingRequest, token: any) {
//   try {
//     const userId = token.id; // 토큰에서 사용자 ID 추출
//     const notifyEnabled = req.notifyEnabled; // 요청에서 생체 인증 활성화 여부를 받음

//     // 먼저 user_setting 레코드의 Id를 찾기
//     const userSetting = await prisma.user_setting.findFirst({
//       where: { user_Id: userId },
//       select: { Id: true },
//     });

//     // 해당 사용자 설정이 없는 경우 처리
//     if (!userSetting) {
//       return new Response(
//         JSON.stringify({ error: "사용자 설정을 찾을 수 없음" }),
//         {
//           status: 404,
//         }
//       );
//     }

//     // 사용자 설정 업데이트
//     const updateResult = await prisma.user_setting.update({
//       where: { Id: userSetting.Id },
//       data: { notify: notifyEnabled ? "ON" : "OFF" },
//     });
//     logger.info(
//       `사용자 ID ${userId}의 알림 설정이 ${
//         notifyEnabled ? "켜짐" : "꺼짐"
//       }으로 업데이트되었습니다.`
//     );
//     // 성공적으로 업데이트된 경우
//     return new Response(
//       JSON.stringify({
//         success: true,
//         message: `알림 설정이 ${
//           notifyEnabled ? "켜짐" : "꺼짐"
//         }으로 업데이트됨`,
//         updateResult,
//       }),
//       { status: 200 }
//     );
//   } catch (error) {
//     if (error instanceof Error) {
//       logger.error(`알림 설정 업데이트 중 오류 발생: ${error.message}`, {
//         errorStack: error.stack,
//         userId: token.id,
//       });
//       return new Response(
//         JSON.stringify({
//           error: "내부 서버 오류",
//           message: error.message,
//         }),
//         { status: 500 }
//       );
//     }
//   }
// }
