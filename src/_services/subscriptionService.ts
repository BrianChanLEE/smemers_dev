import prisma from '@/src/lib/prisma';
import Logger from '@/src/middleware/logger';
import {
  SubInfluencerRequest,
  SubStores,
} from '@/types/interface/subscription_Interface';
import {Token} from '@/types/interface/Token_Interface';
const logger = new Logger('logs');
// 구독(subscription) 관련 API

/**
 * 인플루언서 구독 처리 함수
 * 이 함수는 사용자가 인플루언서를 구독하거나 구독 취소하는 요청을 처리합니다. 사용자의 토큰과 인플루언서 ID를 사용하여 구독 또는 구독 취소를 수행합니다.
 *
 * @param {SubInfluencerRequest} req 요청 객체. 인플루언서 ID를 포함합니다.
 * @param {Token} token 사용자 토큰. 사용자 ID를 추출하기 위해 사용됩니다.
 * @returns {Response} 구독 처리 결과에 대한 응답.
 *                     이미 구독 중인 경우 구독 취소를 처리하고 200(OK) 상태 코드와 메시지 반환.
 *                     새로운 구독 생성 시 201(Created) 상태 코드와 구독 정보를 반환.
 *                     해당 인플루언서가 존재하지 않거나 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자 ID와 인플루언서 ID를 이용해 중복 구독 확인.
 * 2. 이미 구독 중인 경우 구독 취소 처리 및 응답 반환.
 * 3. 새 구독의 경우 구독 정보 생성 및 응답 반환.
 * 4. 인플루언서 존재 여부 또는 다른 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function subInfluencer(req: SubInfluencerRequest, token: Token) {
  try {
    // 중복 구독 확인
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        influencer_Id: req.influencer_Id,
        user_Id: token.id,
      },
    });

    if (existingSubscription) {
      // 이미 존재하는 구독이면 구독 취소 처리
      await prisma.subscription.delete({
        where: {id: existingSubscription.id},
      });

      logger.info(
        `구독 취소: 사용자 ID ${token.id}, 인플루언서 ID ${req.influencer_Id}`,
      );
      return new Response(
        JSON.stringify({message: '구독이 취소되었습니다.'}),
        {status: 200}, // OK
      );
    } else {
      // 새 구독 생성
      const newSubscription = await prisma.subscription.create({
        data: {
          influencer_Id: req.influencer_Id,
          user_Id: token.id,
        },
      });

      logger.info(`${req.influencer_Id}에 대한 구독 생성 성공`);
      const serializedSubscription = {
        id: newSubscription.id.toString(),
        influencer_Id: newSubscription.influencer_Id!.toString(),
      };

      return new Response(JSON.stringify(serializedSubscription), {
        status: 201, // Created
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error('구독 처리 중 오류 발생: ' + error.message);
      return new Response(JSON.stringify({error: '내부 서버 오류'}), {
        status: 500, // Internal Server Error
      });
    }
  }
}
/************************************************************************************************************/

/**
 * 스토어 구독 처리 함수
 * 이 함수는 사용자가 스토어를 구독하거나 구독 취소하는 요청을 처리합니다. 사용자의 토큰과 스토어 ID를 사용하여 구독 또는 구독 취소를 수행합니다.
 *
 * @param {SubInfluencerRequest} req 요청 객체. 스토어 ID를 포함합니다.
 * @param {Token} token 사용자 토큰. 사용자 ID를 추출하기 위해 사용됩니다.
 * @returns {Response} 구독 처리 결과에 대한 응답.
 *                     이미 구독 중인 경우 구독 취소를 처리하고 200(OK) 상태 코드와 메시지 반환.
 *                     새로운 구독 생성 시 201(Created) 상태 코드와 구독 정보를 반환.
 *                     해당 스토어가 존재하지 않거나 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자 ID와 스토어 ID를 이용해 중복 구독 확인.
 * 2. 이미 구독 중인 경우 구독 취소 처리 및 응답 반환.
 * 3. 새 구독의 경우 구독 정보 생성 및 응답 반환.
 * 4. 스토어 존재 여부 또는 다른 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function subStore(req: SubStores, token: Token) {
  try {
    // 중복 구독 확인
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        store_Id: req.store_Id,
        user_Id: token.id,
      },
    });

    if (existingSubscription) {
      // 이미 존재하는 구독이면 구독 취소 처리
      await prisma.subscription.delete({
        where: {id: existingSubscription.id},
      });

      logger.info(
        `구독 취소: 사용자 ID ${token.id}, 스토어 ID ${req.store_Id}`,
      );
      return new Response(
        JSON.stringify({message: '구독이 취소되었습니다.'}),
        {status: 200}, // OK
      );
    } else {
      // 새 구독 생성
      const newSubscription = await prisma.subscription.create({
        data: {
          store_Id: req.store_Id,
          user_Id: token.id,
        },
      });

      logger.info(`${req.store_Id}에 대한 구독 생성 성공`);
      const serializedSubscription = {
        id: newSubscription.id.toString(),
        store_Id: newSubscription.store_Id?.toString(),
      };

      return new Response(JSON.stringify(serializedSubscription), {
        status: 201, // Created
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error('구독 처리 중 오류 발생: ' + error.message);
      return new Response(JSON.stringify({error: '내부 서버 오류'}), {
        status: 500, // Internal Server Error
      });
    }
  }
}

/************************************************************************************************************/

/**
 * 사용자의 인플루언서 구독 목록 조회 함수
 * 이 함수는 사용자가 구독한 인플루언서의 목록을 조회합니다. 사용자의 토큰을 사용하여 해당 사용자가 구독한 인플루언서의 ID 목록을 반환합니다.
 *
 * @param {Token} token 사용자 토큰. 사용자 ID를 추출하기 위해 사용됩니다.
 * @returns {Response} 구독 목록 조회 결과에 대한 응답.
 *                     구독한 인플루언서가 없는 경우 204(No Content) 상태 코드와 메시지 반환.
 *                     구독 목록이 있는 경우 200(OK) 상태 코드와 인플루언서 ID 목록을 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자 ID를 이용해 구독한 인플루언서 목록 조회.
 * 2. 구독 목록이 없는 경우 적절한 응답 반환.
 * 3. 구독 목록이 있는 경우 인플루언서 ID 목록을 생성하여 반환.
 * 4. 조회 중 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function getSubListForInfluencer(token: Token) {
  try {
    // 사용자가 구독한 인플루언서 목록 조회
    const subListForInfluencer = await prisma.subscription.findMany({
      where: {user_Id: token.id, influencer_Id: {not: null}},
    });

    if (subListForInfluencer.length === 0) {
      logger.info('구독한 인플루언서가 없습니다.');
      return new Response(
        JSON.stringify({message: '구독한 인플루언서가 없습니다.'}),
        {status: 204}, // No Content
      );
    }

    // 인플루언서 ID를 포함한 리스트 생성
    const serializedSubList = subListForInfluencer.map(subscription => ({
      influencer_Id: subscription.influencer_Id
        ? subscription.influencer_Id.toString()
        : null,
    }));

    logger.info(`사용자 ID ${token.id}의 구독 리스트 생성 성공`);
    return new Response(JSON.stringify(serializedSubList), {status: 200}); // OK
  } catch (error) {
    if (error instanceof Error) {
      logger.error('구독 리스트 처리 중 오류 발생: ' + error.message);
      return new Response(
        JSON.stringify({error: '내부 서버 오류', message: error.message}),
        {
          status: 500, // Internal Server Error
        },
      );
    }
  }
}

/************************************************************************************************************/

/**
 * 사용자의 스토어 구독 목록 조회 함수
 * 이 함수는 사용자가 구독한 스토어 목록을 조회합니다. 사용자의 토큰을 사용하여 해당 사용자가 구독한 스토어 ID 목록을 반환합니다.
 *
 * @param {Token} token 사용자 토큰. 사용자 ID를 추출하기 위해 사용됩니다.
 * @returns {Response} 구독 목록 조회 결과에 대한 응답.
 *                     구독한 스토어가 없는 경우 204(No Content) 상태 코드와 메시지 반환.
 *                     구독 목록이 있는 경우 200(OK) 상태 코드와 스토어 ID 목록을 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자 ID를 이용해 구독한 스토어 목록 조회.
 * 2. 구독 목록이 없는 경우 적절한 응답 반환.
 * 3. 구독 목록이 있는 경우 스토어 ID 목록을 생성하여 반환.
 * 4. 조회 중 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function getSubListForStore(token: Token) {
  try {
    // 사용자가 구독한 스토어 목록 조회
    const subListForStore = await prisma.subscription.findMany({
      where: {user_Id: token.id, store_Id: {not: null}},
    });

    if (subListForStore.length === 0) {
      logger.info('구독한 스토어가 없습니다.');
      return new Response(
        JSON.stringify({message: '구독한 스토어가 없습니다.'}),
        {status: 204}, // No Content
      );
    }

    // 스토어 ID를 포함한 리스트 생성
    const serializedSubList = subListForStore.map(subscription => ({
      store_Id: subscription.store_Id ? subscription.store_Id.toString() : null,
    }));

    logger.info(`사용자 ID ${token.id}의 구독 리스트 생성 성공`);
    return new Response(JSON.stringify(serializedSubList), {status: 200}); // OK
  } catch (error) {
    if (error instanceof Error) {
      logger.error('구독 리스트 처리 중 오류 발생: ' + error.message);
      return new Response(
        JSON.stringify({error: '내부 서버 오류', message: error.message}),
        {
          status: 500, // Internal Server Error
        },
      );
    }
  }
}

/************************************************************************************************************/

/**
 * 사용자의 (전체)구독 리스트를 조회하는 함수
 *
 * @param {Object} req 요청 객체
 *  @param {Object} token 토큰 객체
 * @returns {Response} 좋아요 리스트에 대한 응답
 */
export async function getSubscriptionList(token: Token) {
  try {
    const subscriptionList = await prisma.subscription.findMany({
      where: {
        user_Id: token.id,
      },
    });
    console.log('subscriptionList :', subscriptionList);
    // // 구독 목록이 비어있는 경우
    // if (subscriptionList.length === 0) {
    //   logger.info("구독한 스토어 또는 인플루언서가 없습니다.");
    //   return new Response(null, { status: 204 }); // No Content
    // }

    // 구독 목록이 비어있는 경우
    if (subscriptionList.length === 0) {
      logger.info('구독한 스토어 또는 인플루언서가 없습니다.');
      return new Response(
        JSON.stringify({
          message: '구독한 스토어 또는 인플루언서가 없습니다.',
        }),
        {status: 200}, // No Content
      );
    }

    const filterSubScriptionList = subscriptionList.filter(
      subscription => subscription.store_Id || subscription.influencer_Id,
    );
    console.log('filterSubScriptionList :', filterSubScriptionList);
    // 인플루언서와 스토어 ID를 포함한 목록 생성
    const serializedSubscriptionList = filterSubScriptionList.map(
      subscription => ({
        store_Id: subscription.store_Id?.toString(),
        influencer_Id: subscription.influencer_Id?.toString(),
      }),
    );

    logger.info(`사용자 ID ${token.id}의 구독자 리스트 생성 성공`);
    return new Response(JSON.stringify(serializedSubscriptionList), {
      status: 200,
    }); // OK
  } catch (error) {
    if (error instanceof Error) {
      logger.error('구독자 리스트 처리 중 오류 발생: ' + error.message);
      return new Response(
        JSON.stringify({error: '내부 서버 오류', message: error.message}),
        {status: 500}, // Internal Server Error
      );
    }
  }
}

/************************************************************************************************************\



// /************************************************************************************************************\

// /**
//  * 인플루언서 구독 취소 함수
//  *
//  * @param {Object} req 요청 객체
//  * @param {Object} token 토큰 객체
//  * @param {any} data 업데이트 할 데이터
//  * @returns {Response} 업데이트된 구독 정보에 대한 응답
//  */

// export async function updateInfluencerSubscription(
//   req: UpdateInfluencerSubRequest,
//   token: Token,
//   data: UpdateInfluencerSubData
// ) {
//   console.log("xxxxx:");
//   try {
//     // 현재 구독 중인 인플루언서 찾기
//     const currentSubscription = await prisma.subscription.findFirst({
//       where: {
//         user_Id: token.id,
//         influencer_Id: req.influencer_Id,
//       },
//     });
//     console.log("currentSubscription", currentSubscription);

//     // 해당 구독이 존재하지 않는 경우
//     if (!currentSubscription) {
//       logger.error("해당 구독이 존재하지 않습니다.");
//       return new Response(
//         JSON.stringify({ error: "구독이 존재하지 않습니다." }),
//         {
//           status: 404, // Not Found 상태 코드
//         }
//       );
//     }

//     // 구독 정보 업데이트
//     const updatedSubscription = await prisma.subscription.update({
//       where: {
//         id: currentSubscription.id,
//       },
//       data: {
//         influencer_deactivate: true,
//       },
//     });

//     const serializeUpdatedSub = {
//       id: currentSubscription.id.toString(),
//       influencer_deactivate: updatedSubscription.influencer_deactivate,
//     };
//     logger.info(`구독 업데이트 성공: ${updatedSubscription.id}`);
//     return new Response(JSON.stringify(serializeUpdatedSub), { status: 200 });
//   } catch (error) {
//     if (error instanceof Error) {
//       logger.error("구독 업데이트 중 오류 발생: " + error.message);
//       return new Response(JSON.stringify({ error: "내부 서버 오류" }), {
//         status: 500,
//       });
//     }
//   }
// }

// /************************************************************************************************************\

// /**
//  * 스토어를  구독 취소  함수
//  *
//  * @param {Object} req 요청 객체
//  * @param {Object} token 토큰 객체
//  * @param {any} data 업데이트 할 데이터
//  * @returns {Response} 업데이트된 구독 정보에 대한 응답
//  */

// export async function updateStoreSubscription(
//   req: UpdateStoreSubRequest,
//   token: Token,
//   data: UpdateStoreSubData
// ) {
//   try {
//     // 현재 구독 중인 스토어 찾기
//     const currentSubscription = await prisma.subscription.findFirst({
//       where: {
//         user_Id: token.id,
//         store_Id: req.store_Id,
//       },
//     });

//     // 해당 구독이 존재하지 않는 경우
//     if (!currentSubscription) {
//       logger.error("해당 구독이 존재하지 않습니다.");
//       return new Response(
//         JSON.stringify({ error: "구독이 존재하지 않습니다." }),
//         {
//           status: 404, // Not Found 상태 코드
//         }
//       );
//     }

//     // 구독 정보 업데이트
//     const updatedSubscription = await prisma.subscription.update({
//       where: {
//         id: currentSubscription.id,
//       },
//       data: {
//         store_deactivate: true,
//       },
//     });

//     const serializeUpdatedSub = {
//       id: currentSubscription.id.toString(),
//       store_deactivate: updatedSubscription.store_deactivate,
//     };
//     logger.info(`구독 업데이트 성공: ${updatedSubscription.id}`);
//     return new Response(JSON.stringify(serializeUpdatedSub), { status: 200 });
//   } catch (error) {
//     if (error instanceof Error) {
//       logger.error("구독 업데이트 중 오류 발생: " + error.message);
//       return new Response(JSON.stringify({ error: "내부 서버 오류" }), {
//         status: 500,
//       });
//     }
//   }
// }

// /************************************************************************************************************\

// /**
//  * membership을  구독 취소  함수
//  *
//  * @param {Object} req 요청 객체
//  * @param {Object} token 토큰 객체
//  * @param {any} data 업데이트 할 데이터
//  * @returns {Response} 업데이트된 구독 정보에 대한 응답
//  */

// export async function updateMembershipSubscription(
//   req: UpdateMembershipSubRequest,
//   token: Token,
//   data: UpdateMembershipSubData
// ) {
//   try {
//     // 현재 구독 중인 스토어 찾기
//     const currentSubscription = await prisma.subscription.findFirst({
//       where: {
//         user_Id: token.id,
//         membership_Id: req.membership_Id,
//       },
//     });

//     // 해당 구독이 존재하지 않는 경우
//     if (!currentSubscription) {
//       logger.error("해당 구독이 존재하지 않습니다.");
//       return new Response(
//         JSON.stringify({ error: "구독이 존재하지 않습니다." }),
//         {
//           status: 404, // Not Found 상태 코드
//         }
//       );
//     }

//     // 구독 정보 업데이트
//     const updatedSubscription = await prisma.subscription.update({
//       where: {
//         id: currentSubscription.id,
//       },
//       data: {
//         membership_deactivate: true,
//       },
//     });

//     const serializeUpdatedSub = {
//       id: currentSubscription.id.toString(),
//       membership_deactivate: updatedSubscription.membership_deactivate,
//     };
//     logger.info(`구독 업데이트 성공: ${updatedSubscription.id}`);
//     return new Response(JSON.stringify(serializeUpdatedSub), { status: 200 });
//   } catch (error) {
//     if (error instanceof Error) {
//       logger.error("구독 업데이트 중 오류 발생: " + error.message);
//       return new Response(JSON.stringify({ error: "내부 서버 오류" }), {
//         status: 500,
//       });
//     }
//   }
// }
