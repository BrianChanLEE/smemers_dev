// import prisma from "@/src/lib/prisma";
// import { RequestTerms } from "@/src/interface/terms_Interface";
// import Logger from "@/src/middleware/logger";
// const logger = new Logger("logs");

// export async function terms(req: RequestTerms) {
//   logger.info("회원가입 약관 처리 시작");

//   // 입력 유효성 검사
//   if (
//     !req.TermsOfServiceAgreement ||
//     !req.PersonalInformationCollection ||
//     !req.PersonalInformationProcessing === undefined
//   ) {
//     logger.error("필수 약관 동의 항목 누락");
//     return new Response(
//       JSON.stringify({ error: "필수 약관 동의 항목이 누락되었습니다." }),
//       { status: 400 }
//     ); // Bad Request
//   }

//   try {
//     // 약관 정보 저장
//     const terms = await prisma.terms.create({
//       data: {
//         TermsID: user.id, // 이 부분은 사용자 ID를 어디에서 가져올지 확인이 필요합니다.
//         TermsOfServiceAgreement: req.TermsOfServiceAgreement,
//         PersonalInformationCollection: req.PersonalInformationCollection,
//         PersonalInformationProcessing: req.PersonalInformationProcessing,
//         AdvertisingInformationReception: req.AdvertisingInformationReception,
//       },
//     });

//     logger.info("회원가입 약관 정보가 성공적으로 저장되었습니다.");
//     return new Response(JSON.stringify({ success: true, terms }), {
//       status: 201,
//     }); // Created
//   } catch (error) {
//     if (error instanceof Error) {
//       logger.error("회원가입 약관 처리 중 오류 발생: " + error.message);
//       return new Response(JSON.stringify({ error: error.message }), {
//         status: 500,
//       }); // Internal Server Error
//     }
//   }
// }
