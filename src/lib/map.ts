import Logger from "@/src/middleware/logger";
const logger = new Logger("logs");

/************************************************************************************************************/
// Haversine 공식을 이용하여 두 지점 사이의 거리를 계산하는 함수
export async function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  // 도(degree)를 라디안(radian) 단위로 변환하는 내부 함수
  function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  try {
    const R = 6371; // 지구의 반지름 (km 단위)
    const dLat = deg2rad(lat2 - lat1); // 위도 차이를 라디안으로 변환
    const dLon = deg2rad(lon2 - lon1); // 경도 차이를 라디안으로 변환
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // 계산된 거리 (km 단위)
  } catch (error) {
    if (error instanceof Error) {
      // 오류 발생 시, 오류 메시지를 로그로 기록하고 오류를 던집니다.
      logger.error(`거리 계산 중 오류 발생: ${error.message}`);
      throw new Error(`거리 계산 중 오류 발생`);
    }
  }
}

/************************************************************************************************************/

/**
 * 두 지점 사이의 거리를 계산하는 함수
 * 이 함수는 Haversine 공식을 사용하여 지구 상의 두 지점 사이의 거리를 미터 단위로 계산합니다. 위도와 경도를 매개변수로 받아 지구의 곡률을 고려한 거리를 반환합니다.
 *
 * @param {number} lat1 첫 번째 지점의 위도.
 * @param {number} lon1 첫 번째 지점의 경도.
 * @param {number} lat2 두 번째 지점의 위도.
 * @param {number} lon2 두 번째 지점의 경도.
 * @returns {number} 두 지점 사이의 거리(미터 단위). 계산 중 오류 발생 시 오류 메시지를 로그로 기록하고 오류를 던짐.
 *
 * 처리 과정:
 * 1. 위도와 경도를 라디안 단위로 변환.
 * 2. 두 지점 사이의 위도 차이와 경도 차이 계산.
 * 3. Haversine 공식을 사용하여 거리 계산.
 * 4. 계산된 거리를 미터 단위로 변환하여 반환.
 * 5. 계산 중 오류 발생 시, 오류 메시지 로깅 및 예외 처리.
 */

// Haversine 공식을 이용하여 두 지점 사이의 거리를 계산하는 함수
export function getDistanceFromLatLonInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  // 도(degree)를 라디안(radian) 단위로 변환하는 내부 함수
  function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  try {
    const R = 6371; // 지구의 반지름 (km 단위)
    const dLat = deg2rad(lat2 - lat1); // 위도 차이를 라디안으로 변환
    const dLon = deg2rad(lon2 - lon1); // 경도 차이를 라디안으로 변환
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // 계산된 거리 (m 단위)
  } catch (error) {
    if (error instanceof Error) {
      // 오류 발생 시, 오류 메시지를 로그로 기록하고 오류를 던집니다.
      logger.error(`거리 계산 중 오류 발생: ${error.message}`);
      throw new Error(`거리 계산 중 오류 발생`);
    }
  }
}

/************************************************************************************************************/

/**
 * 두 지점 사이의 거리를 계산하는 함수 (직사각형 근사법)
 * 이 함수는 직사각형 근사법을 사용하여 지구 상의 두 지점 사이의 거리를 미터 단위로 계산합니다. 위도와 경도를 매개변수로 받아 직선 거리를 근사적으로 반환합니다.
 *
 * @param {number} lat1 첫 번째 지점의 위도.
 * @param {number} lon1 첫 번째 지점의 경도.
 * @param {number} lat2 두 번째 지점의 위도.
 * @param {number} lon2 두 번째 지점의 경도.
 * @returns {number} 두 지점 사이의 거리(미터 단위). 계산 중 오류 발생 시 오류 메시지를 로그로 기록하고 오류를 던짐.
 *
 * 처리 과정:
 * 1. 위도와 경도를 라디안 단위로 변환.
 * 2. 두 지점 사이의 위도 차이와 경도 차이를 계산.
 * 3. 직사각형 근사법을 사용하여 거리 계산.
 * 4. 계산된 거리를 미터 단위로 변환하여 반환.
 * 5. 계산 중 오류 발생 시, 오류 메시지 로깅 및 예외 처리.
 */

export function getDistanceFromLatLonInMetersEquirectangular(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  // 도(degree)를 라디안(radian) 단위로 변환하는 내부 함수
  function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  try {
    const R = 6371e3; // 지구의 반지름 (미터 단위)
    const x = deg2rad(lon2 - lon1) * Math.cos(deg2rad((lat1 + lat2) / 2));
    const y = deg2rad(lat2 - lat1);
    return Math.sqrt(x * x + y * y) * R; // 계산된 거리 (m 단위)
  } catch (error) {
    if (error instanceof Error) {
      // 오류 발생 시, 오류 메시지를 로그로 기록하고 오류를 던집니다.
      logger.error(
        `직사각형 근사법을 사용한 거리 계산 중 오류 발생: ${error.message}`
      );
      throw new Error(`직사각형 근사법을 사용한 거리 계산 중 오류 발생`);
    }
  }
}

/************************************************************************************************************/
/**
 *  예시 사용법
async function example() {
  const latitude = 37.7749; // 예시 위도
  const longitude = -122.4194; // 예시 경도
  const radius = 10; // 10km 반경 내의 스토어 검색

  const stores = await findStoresWithinRadius(latitude, longitude, radius);
  console.log(stores);
}

example();
 */

/** 예시 실사용법
 async function example() {
  const latitude = 37.7749; // 예시 위도 (샌프란시스코)
  const longitude = -122.4194; // 예시 경도 (샌프란시스코)
  const radius = 10; // 10km 반경

  // 지정된 위치와 반경 내의 스토어를 찾아 결과 출력
  const stores = await findStoresWithinRadius(latitude, longitude, radius);
  console.log(stores);
}

example();
*/
