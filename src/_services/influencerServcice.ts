import {PrismaClient} from '@prisma/client';
import Logger from '@/src/middleware/logger';
import {
  createInfluencerData,
  UpdateInfluencerData,
} from '@/types/interface/influencer_Interface';
import {validateEmail} from '@/src/middleware/validate';
import {Token} from '@/types/interface/Token_Interface';
const prisma = new PrismaClient();
const logger = new Logger('logs');

/**
 * 인플루언서 계정 생성 처리 함수
 * 이 함수는 새로운 인플루언서 계정을 생성합니다. 인플루언서의 계정, 이미지 URL, 콘텐츠, 추천 코드, 웹사이트 정보가 요청 객체에 포함되어야 합니다. 사용자 인증은 토큰을 통해 이루어집니다. 이미 가게 사용자로 등록된 경우, 인플루언서 등록이 제한됩니다.
 *
 * @param {createInfluencerData} req 요청 객체. 인플루언서의 계정, 이미지 URL, 콘텐츠, 추천 코드, 웹사이트 정보를 포함합니다.
 * @param {Token} token 사용자 인증 토큰 객체. 사용자 ID를 추출하기 위해 사용됩니다.
 * @returns {Response} 인플루언서 계정 생성 결과에 대한 응답.
 *                     이미 가게 사용자로 등록된 경우 409(Conflict) 상태 코드와 오류 메시지 반환.
 *                     인플루언서 계정 생성 성공 시 201(Created) 상태 코드와 생성된 인플루언서 정보 반환.
 *                     제공된 계정이 이미 존재하는 경우 409(Conflict) 상태 코드와 오류 메시지 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 사용자 인증 토큰을 통한 사용자 ID 추출 및 기존 가게 사용자 여부 확인.
 * 2. 인플루언서 데이터 생성 및 데이터베이스에 저장.
 * 3. 생성된 인플루언서 정보 반환.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function createInfluencer(
  req: createInfluencerData,
  token: Token,
) {
  logger.info('새로운 Influencer 생성을 시작합니다.');

  try {
    // store 테이블에서 해당 user_id를 조회
    const existingStore = await prisma.store.findFirst({
      where: {user_id: token.id},
    });

    // 해당 user_id로 이미 가게가 등록되어 있다면 메시지 반환
    if (existingStore) {
      return new Response(
        JSON.stringify({
          error:
            '이미 등록된 가게 사용자입니다. 인플루언서 등록을 원하신다면 고객센터에 문의 바랍니다.',
        }),
        {status: 409},
      ); // Conflict
    }

    // if (!req.account || !req.contents || !token.id) {
    //   logger.info("필수 정보 누락");
    //   return new Response(
    //     JSON.stringify({ error: "필수 정보가 누락되었습니다." }),
    //     { status: 400 } // Bad Request
    //   );
    // }

    const newInfluencer = await prisma.influencer.create({
      data: {
        account: req.account,
        image_url: req.image_url,
        contents: req.contents,
        referral_code: req.referral_code,
        website: req.website,
        user_id: token.id,
      },
    });
    logger.info('새로운 Influencer를 성공적으로 생성되었습니다.');

    // 이메일 형식 검증
    if (!validateEmail(req.account)) {
      logger.info('유효하지 않은 이메일 형식');
      return new Response(
        JSON.stringify({error: '유효하지 않은 이메일 형식'}),
        {status: 400},
      );
    }

    // 조회된 데이터를 직렬화하여 필요한 데이터만 추출
    const serializedInfluencer = {
      id: newInfluencer.id.toString(),
      account: newInfluencer.account,
      image_url: newInfluencer.image_url,
      contents: newInfluencer.contents,
      referral_code: newInfluencer.referral_code,
      website: newInfluencer.website,
    };

    return new Response(JSON.stringify(serializedInfluencer), {
      status: 201,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error('새로운 Influencer 생성 중 오류 발생: ' + error.message);

      // 데이터베이스 관련 오류 처리
      if (error.message.includes('unique constraint')) {
        return new Response(
          JSON.stringify({error: '제공된 계정은 이미 존재합니다.'}),
          {status: 409}, // Conflict
        );
      }

      return new Response(
        JSON.stringify({error: '내부 서버 오류', message: error.message}),
        {status: 500}, // Internal Server Error
      );
    }
  }
}
/************************************************************************************************************\

/**
 * 특정 ID의 인플루언서 조회 처리 함수
 * 이 함수는 주어진 ID를 가진 인플루언서를 조회합니다. 요청된 ID에 해당하는 인플루언서 정보를 데이터베이스에서 찾아 반환합니다.
 *
 * @param {bigint} id 조회할 인플루언서의 고유 ID.
 * @returns {Response} 인플루언서 조회 결과에 대한 응답.
 *                     해당 ID의 인플루언서가 존재하지 않는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     인플루언서 조회 성공 시 200(OK) 상태 코드와 조회된 인플루언서 정보 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 인플루언서 ID의 유효성 검증.
 * 2. 데이터베이스에서 해당 ID의 인플루언서 조회.
 * 3. 조회된 인플루언서 정보 반환.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */

export async function getInfluencerById(id: bigint) {
  logger.info(`ID ${id}에 해당하는 Influencer 조회를 시작합니다.`);
  try {
    const influencer = await prisma.influencer.findUnique({
      where: {id: id},
    });

    if (!influencer) {
      logger.error(`ID ${id}에 해당하는 Influencer를 찾을 수 없습니다.`);
      return new Response(
        JSON.stringify({error: '해당 Influencer를 찾을 수 없습니다.'}),
        {status: 404}, // Not Found
      );
    }

    logger.info(
      `ID ${id}에 해당하는 Influencer 조회를 성공적으로 완료했습니다.`,
    );
    const serializedInfluencer = {
      id: influencer.id.toString(),
      account: influencer.account,
      image_url: influencer.image_url,
      contents: influencer.contents,
      referral_code: influencer.referral_code,
    };

    return new Response(JSON.stringify(serializedInfluencer), {
      status: 200, // OK
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        `ID ${id}에 해당하는 Influencer 조회 중 오류 발생: ${error.message}`,
      );
      return new Response(
        JSON.stringify({error: '내부 서버 오류', message: error.message}),
        {status: 500}, // Internal Server Error
      );
    }
  }
}

/************************************************************************************************************\
/**
 * 모든 인플루언서 조회 처리 함수
 * 이 함수는 시스템에 등록된 모든 인플루언서를 조회합니다. 인플루언서의 목록을 데이터베이스에서 추출하여 반환합니다.
 *
 * @returns {Response} 인플루언서 목록 조회 결과에 대한 응답.
 *                     인플루언서가 하나도 존재하지 않는 경우 404(Not Found) 상태 코드와 메시지 반환.
 *                     인플루언서 목록 조회 성공 시 200(OK) 상태 코드와 조회된 인플루언서 목록 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 데이터베이스에서 모든 인플루언서 조회.
 * 2. 조회된 인플루언서 목록 직렬화 및 반환.
 * 3. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function getAllInfluencer() {
  logger.info('모든 Influencer 조회를 시작합니다.');
  try {
    const influencers = await prisma.influencer.findMany();

    if (influencers.length === 0) {
      logger.info('조회할 Influencer가 존재하지 않습니다.');
      return new Response(
        JSON.stringify({message: '조회할 Influencer가 존재하지 않습니다.'}),
        {status: 404}, // Not Found
      );
    }

    logger.info('모든 Influencer 조회를 성공적으로 완료했습니다.');
    const serializedInfluencers = influencers.map(influencer => ({
      id: influencer.id.toString(),
      account: influencer.account,
      image_url: influencer.image_url,
      contents: influencer.contents,
      referral_code: influencer.referral_code,
    }));

    return new Response(JSON.stringify(serializedInfluencers), {
      status: 200, // OK
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Influencer 조회 중 오류 발생: ${error.message}`);
      return new Response(
        JSON.stringify({error: '내부 서버 오류', message: error.message}),
        {status: 500}, // Internal Server Error
      );
    }
  }
}

/************************************************************************************************************\

/**
 * 인플루언서 활성화 상태 변경 처리 함수
 * 이 함수는 주어진 ID를 가진 인플루언서의 활성화 상태를 변경합니다. 현재 상태의 반대로 설정되며, 인플루언서가 존재하지 않는 경우 오류 메시지와 함께 404 상태 코드를 반환합니다.
 *
 * @param {number} id 활성화 상태를 변경할 인플루언서의 ID.
 * @returns {Response} 인플루언서 활성화 상태 변경 결과에 대한 응답.
 *                     해당 ID의 인플루언서가 존재하지 않는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     인플루언서 활성화 상태 변경 성공 시 200(OK) 상태 코드와 변경된 활성화 상태 정보 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 인플루언서 ID의 유효성 검증 및 해당 인플루언서 조회.
 * 2. 인플루언서의 존재 여부 확인 후 활성화 상태 변경.
 * 3. 변경된 활성화 상태 정보 반환.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function enabledInfluencer(id: number) {
  logger.info(
    `ID ${id}에 해당하는 Influencer의 활성화 상태 변경을 시작합니다.`,
  );
  try {
    // 먼저 인플루언서가 존재하는지 확인
    const influencer = await prisma.influencer.findUnique({
      where: {id: id},
    });

    if (!influencer) {
      logger.error(`ID ${id}에 해당하는 Influencer를 찾을 수 없습니다.`);
      return new Response(
        JSON.stringify({error: '해당 Influencer를 찾을 수 없습니다.'}),
        {status: 404}, // Not Found
      );
    }
    // console.log("influencer :", influencer);
    // 활성화 상태 변경
    const updatedInfluencer = await prisma.influencer.update({
      where: {id: id},
      data: {
        enabled: !influencer.enabled, // 현재 상태의 반대로 설정
      },
    });

    // console.log("updatedInfluencer :", updatedInfluencer);
    logger.info(
      `ID ${id}에 해당하는 Influencer의 활성화 상태가 변경되었습니다.`,
    );
    const serializedInfluencer = {
      id: updatedInfluencer.id.toString(),
      enabled: updatedInfluencer.enabled,
    };

    return new Response(JSON.stringify(serializedInfluencer), {
      status: 200, // OK
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        `ID ${id}에 해당하는 Influencer 활성화 상태 변경 중 오류 발생: ${error.message}`,
      );
      return new Response(
        JSON.stringify({error: '내부 서버 오류', message: error.message}),
        {status: 500}, // Internal Server Error
      );
    }
  }
}

/************************************************************************************************************\
/**
 * 인플루언서 정보 업데이트 처리 함수
 * 이 함수는 주어진 ID를 가진 인플루언서의 정보를 업데이트합니다. 업데이트할 정보는 요청 데이터에서 제공되며, 인플루언서의 계정, 이미지 URL, 콘텐츠, 추천 코드, 웹사이트 정보를 포함할 수 있습니다.
 *
 * @param {number} id 업데이트할 인플루언서의 ID.
 * @param {UpdateInfluencerData} req 인플루언서 정보 업데이트에 필요한 데이터.
 * @returns {Response} 인플루언서 정보 업데이트 결과에 대한 응답.
 *                     해당 ID의 인플루언서가 존재하지 않는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     인플루언서 정보 업데이트 성공 시 200(OK) 상태 코드와 업데이트된 인플루언서 정보 반환.
 *                     제공된 데이터가 유니크 제약을 위반하는 경우 409(Conflict) 상태 코드와 오류 메시지 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 인플루언서 ID의 유효성 검증 및 해당 인플루언서 조회.
 * 2. 제공된 데이터로 인플루언서 정보 업데이트.
 * 3. 업데이트된 인플루언서 정보 반환.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */

export async function updateInfluencer(id: number, req: UpdateInfluencerData) {
  logger.info(`ID ${id}에 해당하는 Influencer 업데이트를 시작합니다.`);
  try {
    // 인플루언서 존재 여부 확인
    const influencerExists = await prisma.influencer.findUnique({
      where: {id: id},
    });

    if (!influencerExists) {
      logger.error(`ID ${id}에 해당하는 Influencer를 찾을 수 없습니다.`);
      return new Response(
        JSON.stringify({error: '해당 Influencer를 찾을 수 없습니다.'}),
        {status: 404}, // Not Found
      );
    }

    // 인플루언서 정보 업데이트
    const updatedInfluencer = await prisma.influencer.update({
      where: {id: id},
      data: {
        account: req.account,
        image_url: req.image_url,
        contents: req.contents,
        referral_code: req.referral_code,
        website: req.website,
      },
    });

    logger.info(
      `ID ${id}에 해당하는 Influencer 업데이트를 성공적으로 완료했습니다.`,
    );
    const serializedInfluencer = {
      id: updatedInfluencer.id.toString(),
      account: updatedInfluencer.account,
      image_url: updatedInfluencer.image_url,
      contents: updatedInfluencer.contents,
      referral_code: updatedInfluencer.referral_code,
      website: updatedInfluencer.website,
    };

    return new Response(JSON.stringify(serializedInfluencer), {
      status: 200, // OK
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        `ID ${id}에 해당하는 Influencer 업데이트 중 오류 발생: ${error.message}`,
      );

      // 데이터베이스 관련 오류 처리
      if (error.message.includes('unique constraint')) {
        return new Response(
          JSON.stringify({
            error: '제공된 데이터가 유니크 제약을 위반합니다.',
          }),
          {status: 409}, // Conflict
        );
      }

      return new Response(
        JSON.stringify({error: '내부 서버 오류', message: error.message}),
        {status: 500}, // Internal Server Error
      );
    }
  }
}

/************************************************************************************************************/
/**
 * 인플루언서 계정 삭제 처리 함수
 * 이 함수는 주어진 ID를 가진 인플루언서 계정을 삭제합니다. 먼저 인플루언서의 존재 여부를 확인한 후, 존재하는 경우 해당 인플루언서를 데이터베이스에서 삭제합니다.
 *
 * @param {number} id 삭제할 인플루언서의 ID.
 * @returns {Response} 인플루언서 계정 삭제 결과에 대한 응답.
 *                     해당 ID의 인플루언서가 존재하지 않는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     인플루언서 계정 삭제 성공 시 200(OK) 상태 코드와 성공 메시지 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 인플루언서 ID의 유효성 검증 및 해당 인플루언서 조회.
 * 2. 인플루언서 존재 여부 확인 후 삭제 처리.
 * 3. 삭제 완료 후 성공 메시지 반환.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function deleteInfluencer(id: number) {
  logger.info(`ID ${id}에 해당하는 Influencer 삭제를 시작합니다.`);
  try {
    // 인플루언서 존재 여부 확인
    const existingInfluencer = await prisma.influencer.findUnique({
      where: {id: id},
    });
    if (!existingInfluencer) {
      logger.info(`ID ${id}에 해당하는 Influencer가 존재하지 않습니다.`);
      return new Response(
        JSON.stringify({error: '해당 ID의 Influencer가 존재하지 않습니다.'}),
        {status: 404}, // Not Found
      );
    }

    // 인플루언서 삭제
    await prisma.influencer.delete({where: {id: id}});
    logger.info(`ID ${id}에 해당하는 Influencer가 성공적으로 삭제되었습니다.`);

    return new Response(
      JSON.stringify({
        message: 'Influencer 삭제 성공',
        id: id.toString(),
      }),
      {
        status: 200, // OK
      },
    );
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        `ID ${id}에 해당하는 Influencer 삭제 중 오류 발생: ${error.message}`,
      );
      return new Response(
        JSON.stringify({error: '내부 서버 오류', message: error.message}),
        {status: 500}, // Internal Server Error
      );
    }
  }
}
