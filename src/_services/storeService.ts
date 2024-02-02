import {PrismaClient} from '@prisma/client';
import Logger from '@/src/middleware/logger';
import {
  CreateStore,
  CreateStoreRequest,
  UpdateStoreData,
  Token,
} from '@/types/interface/store_Interface';
import {getDistanceFromLatLonInMeters} from '@/src/lib/map';

const prisma = new PrismaClient();
const logger = new Logger('logs');

/**
 * 새로운 매장 생성 처리 함수
 * 이 함수는 사용자 요청에 따라 새로운 매장을 생성합니다. 매장 정보는 요청 객체를 통해 제공되며, 사용자 인증은 토큰을 통해 이루어집니다.
 *
 * @param {CreateStoreRequest} req 요청 객체. 매장의 이름, 주소, 우편번호 등 매장 생성에 필요한 데이터를 포함합니다.
 * @param {Token} token 사용자 인증 토큰 객체. 사용자 ID를 추출하기 위해 사용됩니다.
 * @returns {Response} 매장 생성 결과에 대한 응답.
 *                     필수 정보 누락 시 400(Bad Request) 상태 코드와 오류 메시지 반환.
 *                     매장 생성 성공 시 201(Created) 상태 코드와 생성된 매장 정보 반환.
 *                     이미 존재하는 매장 이름인 경우 409(Conflict) 상태 코드와 오류 메시지 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 요청 데이터의 유효성 검증.
 * 2. 사용자 인증 토큰을 통한 사용자 ID 추출 및 기존 인플루언서 사용자 여부 확인.
 * 3. 매장 데이터 생성 및 데이터베이스에 저장.
 * 4. 생성된 매장 정보 반환.
 * 5. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */

export async function createStore(req: CreateStoreRequest, token: Token) {
  logger.info('새로운 Store 생성을 시작합니다.');
  try {
    //Influencer  테이블에서 해당 user_id를 조회
    const existingStore = await prisma.influencer.findFirst({
      where: {user_id: token.id},
    });

    // 해당 user_id로 이미 인플루언서로 등록되어 있다면 메시지 반환
    if (existingStore) {
      return new Response(
        JSON.stringify({
          error:
            '이미 등록된 안플루언서 사용자입니다. 가게 등록을 원하신다면 고객센터에 문의 바랍니다.',
        }),
        {status: 409},
      ); // Conflict
    }
    // 입력 검증
    if (!req.name || !req.address) {
      logger.info('필수 정보 누락');
      return new Response(
        JSON.stringify({error: '필수 정보가 누락되었습니다.'}),
        {status: 400}, // Bad Request
      );
    }

    const store: CreateStore = {
      name: req.name,
      zip_code: req.zip_code,
      address_etc: req.address_etc,
      phone: req.phone,
      country: req.country,
      address: req.address,
      user_id: parseInt(token.id),
    };

    const newStore = await prisma.store.create({data: store});
    logger.info('새로운 Store가 성공적으로 생성되었습니다.');

    // 조회된 게시글을 직렬화하여 필요한 데이터만 추출
    const serializedStore = {
      id: newStore.id.toString(),
      name: newStore.name,
      country: newStore.country,
      address: newStore.address,
      zip_code: newStore.zip_code,
      address_etc: newStore.address_etc,
      phone: newStore.phone,
    };

    return new Response(JSON.stringify(serializedStore), {
      status: 201,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error('새로운 Store 생성 중 오류 발생: ' + error.message);

      // 데이터베이스 관련 오류 처리
      if (error.message.includes('unique constraint')) {
        return new Response(
          JSON.stringify({error: '이미 존재하는 매장 이름입니다.'}),
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
 * 특정 ID의 매장 조회 처리 함수
 * 이 함수는 주어진 ID를 가진 매장을 조회합니다. 요청된 ID에 해당하는 매장 정보를 데이터베이스에서 찾아 반환합니다.
 *
 * @param {bigint} id 조회할 매장의 고유 ID.
 * @returns {Response} 매장 조회 결과에 대한 응답.
 *                     해당 ID의 매장이 존재하지 않는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     매장 조회 성공 시 200(OK) 상태 코드와 조회된 매장 정보 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 매장 ID의 유효성 검증.
 * 2. 데이터베이스에서 해당 ID의 매장 조회.
 * 3. 조회된 매장 정보 반환.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function getStoreById(id: bigint) {
  try {
    logger.info(`ID ${id}에 해당하는 Store 조회를 시작합니다.`);

    const store = await prisma.store.findUnique({
      where: {id: id},
    });

    if (!store) {
      logger.info(`ID ${id}에 해당하는 Store가 존재하지 않습니다.`);
      return new Response(
        JSON.stringify({error: '해당 ID의 Store가 존재하지 않습니다.'}),
        {status: 404}, // Not Found
      );
    }

    logger.info(`ID ${id}에 해당하는 Store 조회를 성공적으로 완료했습니다.`);
    const serializedStore = {
      id: store.id.toString(),
      name: store.name,
      country: store.country,
      address: store.address,
      zip_code: store.zip_code,
      address_etc: store.address_etc,
      phone: store.phone,
    };

    return new Response(JSON.stringify(serializedStore), {
      status: 200, // OK
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        `ID ${id}에 해당하는 Store 조회 중 오류 발생: ${error.message}`,
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
 * 모든 매장 조회 처리 함수
 * 이 함수는 시스템에 등록된 모든 매장을 조회합니다. 데이터베이스에서 모든 매장의 목록을 추출하여 반환합니다.
 *
 * @returns {Response} 매장 목록 조회 결과에 대한 응답.
 *                     매장이 하나도 존재하지 않는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     매장 목록 조회 성공 시 200(OK) 상태 코드와 조회된 매장 목록 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 데이터베이스에서 모든 매장 조회.
 * 2. 조회된 매장 목록 직렬화 및 반환.
 * 3. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function getAllStores() {
  logger.info('모든 Store 조회를 시작합니다.');
  try {
    const stores = await prisma.store.findMany();

    if (stores.length === 0) {
      logger.info('조회할 Store가 존재하지 않습니다.');
      return new Response(
        JSON.stringify({message: '조회할 Store가 존재하지 않습니다.'}),
        {status: 404}, // Not Found
      );
    }

    logger.info('모든 Store 조회를 성공적으로 완료했습니다.');
    const serializedStores = stores.map(store => ({
      id: store.id.toString(),
      name: store.name,
      country: store.country,
      address: store.address,
      zip_code: store.zip_code,
      address_etc: store.address_etc,
      phone: store.phone,
    }));

    return new Response(JSON.stringify(serializedStores), {
      status: 200, // OK
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Store 조회 중 오류 발생: ${error.message}`);
      return new Response(
        JSON.stringify({error: '내부 서버 오류', message: error.message}),
        {status: 500}, // Internal Server Error
      );
    }
  }
}

/************************************************************************************************************\

/**
 * 매장 활성화 상태 변경 처리 함수
 * 이 함수는 주어진 ID를 가진 매장의 활성화 상태를 변경합니다. 매장이 활성화 상태인 경우 비활성화로, 비활성화 상태인 경우 활성화로 상태를 전환합니다.
 *
 * @param {number} id 상태를 변경할 매장의 ID.
 * @returns {Response} 매장 활성화 상태 변경 결과에 대한 응답.
 *                     해당 ID의 매장이 존재하지 않는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     매장 활성화 상태 변경 성공 시 200(OK) 상태 코드와 변경된 매장의 활성화 상태 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 매장 ID의 유효성 검증 및 해당 매장 조회.
 * 2. 매장의 현재 활성화 상태 확인 및 상태 변경.
 * 3. 변경된 매장의 활성화 상태 반환.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */

export async function enabledStore(id: number) {
  logger.info(`ID ${id}에 해당하는 Store 업데이트를 시작합니다.`);
  try {
    // 먼저 매장이 존재하는지 확인
    const existingStore = await prisma.store.findUnique({where: {id: id}});
    if (!existingStore) {
      logger.info(`ID ${id}에 해당하는 Store가 존재하지 않습니다.`);
      return new Response(
        JSON.stringify({error: '해당 ID의 Store가 존재하지 않습니다.'}),
        {status: 404}, // Not Found
      );
    }

    const updatedStore = await prisma.store.update({
      where: {id: existingStore.id},
      data: {enabled: !existingStore.enabled},
    });

    logger.info(
      `ID ${id}에 해당하는 Store 업데이트를 성공적으로 완료했습니다.`,
    );

    const serializedStore = {
      id: updatedStore.id.toString(),
      enabled: updatedStore.enabled,
    };

    return new Response(JSON.stringify(serializedStore), {
      status: 200, // OK
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        `ID ${id}에 해당하는 Store 업데이트 중 오류 발생: ${error.message}`,
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
 * 매장 정보 업데이트 처리 함수
 * 이 함수는 주어진 ID를 가진 매장의 정보를 업데이트합니다. 업데이트할 정보는 요청 데이터에서 제공됩니다.
 *
 * @param {number} id 업데이트할 매장의 ID.
 * @param {UpdateStoreData} req 매장 정보 업데이트에 필요한 데이터.
 * @returns {Response} 매장 정보 업데이트 결과에 대한 응답.
 *                     해당 ID의 매장이 존재하지 않는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     매장 정보 업데이트 성공 시 200(OK) 상태 코드와 업데이트된 매장 정보 반환.
 *                     제공된 데이터가 유니크 제약을 위반하는 경우 409(Conflict) 상태 코드와 오류 메시지 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 매장 ID의 유효성 검증 및 해당 매장 조회.
 * 2. 제공된 데이터로 매장 정보 업데이트.
 * 3. 업데이트된 매장 정보 반환.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function updateStore(id: number, req: UpdateStoreData) {
  logger.info(`ID ${id}에 해당하는 Store 업데이트를 시작합니다.`);
  try {
    // 먼저 매장이 존재하는지 확인
    const existingStore = await prisma.store.findUnique({where: {id: id}});
    if (!existingStore) {
      logger.info(`ID ${id}에 해당하는 Store가 존재하지 않습니다.`);
      return new Response(
        JSON.stringify({error: '해당 ID의 Store가 존재하지 않습니다.'}),
        {status: 404}, // Not Found
      );
    }

    const updatedStore = await prisma.store.update({
      where: {id: id},
      data: {
        name: req.name,
        zip_code: req.zip_code,
        address_etc: req.address_etc,
        phone: req.phone,
        open_time: req.open_time,
        close_time: req.close_time,
        open_days: req.open_days,
        website: req.website,
        images: req.images,
        kind: req.kind,
        referral_code: req.referral_code,
        country: req.country,
        address: req.address,
      },
    });

    logger.info(
      `ID ${id}에 해당하는 Store 업데이트를 성공적으로 완료했습니다.`,
    );
    const serializedStore = {
      id: updatedStore.id.toString(),
      name: updatedStore.name,
      country: updatedStore.country,
      address: updatedStore.address,
      zip_code: updatedStore.zip_code,
      address_etc: updatedStore.address_etc,
      phone: updatedStore.phone,
    };

    return new Response(JSON.stringify(serializedStore), {
      status: 200, // OK
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        `ID ${id}에 해당하는 Store 업데이트 중 오류 발생: ${error.message}`,
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

/************************************************************************************************************\

/**
 * 매장 삭제 처리 함수
 * 이 함수는 주어진 ID를 가진 매장을 데이터베이스에서 삭제합니다. 삭제하기 전에 매장의 존재 여부를 확인합니다.
 *
 * @param {bigint} id 삭제할 매장의 ID.
 * @returns {Response} 매장 삭제 결과에 대한 응답.
 *                     해당 ID의 매장이 존재하지 않는 경우 404(Not Found) 상태 코드와 오류 메시지 반환.
 *                     매장 삭제 성공 시 200(OK) 상태 코드와 성공 메시지 반환.
 *                     서버 내부 오류 또는 특정 오류 조건 발생 시 적절한 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 매장 ID의 유효성 검증 및 해당 매장 조회.
 * 2. 매장 존재 여부 확인 후 삭제 처리.
 * 3. 삭제 완료 후 성공 메시지 반환.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function deleteStore(id: bigint) {
  logger.info(`ID ${id}에 해당하는 Store 삭제를 시작합니다.`);
  try {
    // 먼저 매장이 존재하는지 확인
    const existingStore = await prisma.store.findUnique({where: {id: id}});
    if (!existingStore) {
      logger.info(`ID ${id}에 해당하는 Store가 존재하지 않습니다.`);
      return new Response(
        JSON.stringify({error: '해당 ID의 Store가 존재하지 않습니다.'}),
        {status: 404}, // Not Found
      );
    }

    const removeStore = await prisma.store.delete({where: {id}});

    logger.info(`ID ${id}에 해당하는 Store 삭제를 성공적으로 완료했습니다.`);
    return new Response(
      JSON.stringify({
        message: 'Store 삭제 성공',
        id: removeStore.id.toString(),
      }),
      {
        status: 200, // OK
      },
    );
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        `ID ${id}에 해당하는 Store 삭제 중 오류 발생: ${error.message}`,
      );

      // 데이터베이스 관련 오류 처리
      if (error.message.includes('Record to delete does not exist.')) {
        return new Response(
          JSON.stringify({error: '삭제할 Store가 존재하지 않습니다.'}),
          {status: 404}, // Not Found
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
 * 특정 좌표 반경 내 매장 조회 함수
 * 이 함수는 주어진 위도(lat), 경도(lng) 및 반경(radius)을 기준으로 해당 범위 내에 있는 활성화된 매장을 조회합니다.
 *
 * @param {number} lat 위도 좌표.
 * @param {number} lng 경도 좌표.
 * @param {number} radius 반경(미터 단위).
 * @returns {Response} 매장 조회 결과에 대한 응답.
 *                     반경 내에 매장이 존재하지 않는 경우 404(Not Found) 상태 코드와 메시지 반환.
 *                     반경 내에 있는 매장 조회 성공 시 200(OK) 상태 코드와 조회된 매장 목록 반환.
 *                     서버 내부 오류 발생 시 500(Internal Server Error) 상태 코드와 오류 메시지 반환.
 *
 * 처리 과정:
 * 1. 주어진 좌표와 반경을 기준으로 활성화된 매장 조회.
 * 2. 각 매장의 위치를 계산하여 반경 내에 있는지 판별.
 * 3. 조회된 매장 목록 반환.
 * 4. 오류 발생 시 적절한 상태 코드와 메시지 반환.
 */
export async function getStoresWithinRadius(
  lat: number,
  lng: number,
  radius: number,
) {
  logger.info(
    `주어진 좌표 (${lat}, ${lng})로부터 반경 ${radius}m 내의 Store 조회를 시작합니다.`,
  );
  try {
    const allStores = await prisma.store.findMany({
      where: {
        lat: {not: null},
        lng: {not: null},
        enabled: true,
      },
    });

    const storesWithinRadius = allStores.filter(store => {
      if (store.lat === null || store.lng === null) {
        return false;
      }
      try {
        const distance = getDistanceFromLatLonInMeters(
          lat,
          lng,
          store.lat,
          store.lng,
        );
        return distance! <= radius * 1000;
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`거리 계산 오류: ${error.message}`);
          return false;
        }
      }
    });

    if (storesWithinRadius.length === 0) {
      logger.info('반경 내에 스토어가 존재하지 않음');
      return new Response(
        JSON.stringify({message: '반경 내에 스토어가 없습니다.'}),
        {status: 404}, // Not Found
      );
    }

    const serializedStores = storesWithinRadius.map(store => ({
      id: store.id.toString(),
      name: store.name,
    }));

    logger.info(`반경 ${radius}m 내에 있는 스토어 조회 성공`);
    return new Response(JSON.stringify(serializedStores), {status: 200}); // OK
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        `반경 내에 있는 모든 Store 조회 중 오류 발생: ${error.message}`,
      );
      return new Response(
        JSON.stringify({error: '내부 서버 오류', message: error.message}),
        {status: 500}, // Internal Server Error
      );
    }
  }
}
