##Smember_DEV

<!-- 프로젝트 개요 -->

Smember_DEV는 다양한 매장 정보를 관리하고 사용자들에게 매장 관련 서비스를 제공하는 웹 애플리케이션입니다. 사용자는 특정 위치에서 일정 반경 내의 매장을 조회하고, 매장 정보를 추가, 수정, 삭제할 수 있습니다.

/_ ---------------- 시작하기 ----------------_/
이 프로젝트를 실행하기 전에 아래 조건들이 필요합니다:
1.Node.js
2.npm (Node.js 패키지 매니저)
3.Prisma
4.MySQL 데이터베이스

/_ ---------------- 설치 방법 ----------------_/

1. 의존성 패키지 설치하기: npm install
2. 데이터베이스 설정하기 (Prisma 스키마 파일 이용): npx prisma db pull
3. 환경 변수 설정하기 (env 파일 참고).
4. 애플리케이션 실행하기: npm run dev

/_ ----------------기능----------------_/

##Account##
인증 코드 발급: POST /api/account/code 엔드포인트를 통해 회원가입 또는 로그인을 위한 인증코드를 발급 받을수 있습니다.
로그인 : POST /api/account/login 엔드포인트를 통해 로그인할 수 있습니다.
회원가입: POST /api/account/register 엔드포인트를 통해 새로운 매장을 추가할 수 있습니다.

##Store##
매장 조회: GET /api/store/findAll 엔드포인트를 통해 매장을 조회할 수 있습니다.
매장 조회: GET /api/store/findOne/${id} 엔드포인트를 통해 매장을 조회할 수 있습니다.
매장 조회: GET /api/store/map/${lat}/${lng}/${radius} 엔드포인트를 통해 현재 위치 기준으로 매장을 조회할 수 있습니다.
매장 신청: POST /api/store/join 엔드포인트를 통해 새로운 매장을 신청할 수 있습니다.
매장 활성화: PUT /api/store/enabled/${id} 엔드포인트를 통해 기존 매장 정보를 활성화 할 수 있습니다.(**관리자 권한** : 자료 검토후 인증시키는 API)
매장 업데이트: PUT /api/store/update/${id} 엔드포인트를 통해 기존 매장 정보를 업데이트 할 수 있습니다.
매장 삭제: DELETE /api/store/delete/${id} 엔드포인트를 통해 매장을 삭제할 수 있습니다.

##Influencer##
인플루언서 조회: GET /api/influencer/findAll 엔드포인트를 통해 모든 인플루언서를 조회할 수 있습니다.
인플루언서 조회: GET /api/influencer/findOne/${id} 엔드포인트를 통해 인플루언서를 조회할 수 있습니다.
인플루언서 신청: POST /api/influencer/join 엔드포인트를 통해 인플루언서를 신청할 수 있습니다.
인플루언서 활성화: PUT /api/influencer/update/${id} 엔드포인트를 통해 인플루언서를 활성화 할 수 있습니다(**관리자 권한** : 자료 검토후 인증시키는 API)
인플루언서 업데이트: PUT /api/influencer/update/${id} 엔드포인트를 통해 기존 인플루언서 정보를 업데이트 할 수 있습니다.
인플루언서 삭제: DELETE /api/influencer/delete/${id} 엔드포인트를 통해 인플루언서를 삭제할 수 있습니다.

##Notice##
공지사항을 조회: GET /api/notice/findAll 엔드포인트를 통해 공지사항을 조회할 수 있습니다.
공지사항을 조회: GET /api/notice/findOne/${id} 엔드포인트를 통해 공지사항을 조회할 수 있습니다.
공지사항을 조회: GET /api/notice/findOne/PUBLIC 엔드포인트를 통해 "공개"인 공지사항을 조회할 수 있습니다.
공지사항을 추가: POST /api/notice/write 엔드포인트를 통해 새로운 공지사항을 추가할 수 있습니다.
공지사항을 수정: PUT /api/notice/update/${id} 엔드포인트를 통해 기존 공지사항 정보를 수정할 수 있습니다.
공지사항을 삭제: DELETE /api/notice/delete/${id} 엔드포인트를 통해 공지사항을 삭제할 수 있습니다.

##Like##
일반 유저 좋아요 : POST /api/like/LikeUser 엔드포인트를 통해 좋아요를 추가할 수 있습니다.
상점 좋아요 : POST /api/like/LikeStore 엔드포인트를 통해 좋아요를 추가할 수 있습니다.
인플루언서 좋아요: POST /api/like/likeInfluencer 엔드포인트를 통해 좋아요를 추가할 수 있습니다.
공지사항 좋아요: POST /api/like/LikeNotice 엔드포인트를 통해 좋아요를 추가할 수 있습니다.
좋아요 삭제: DELETE /api/like/remove/${id} 엔드포인트를 통해 좋아요를 삭제할 수 있습니다.

/_ ----------------기술 스택----------------_/
Frontend: Next.js
Backend: Next.js, Prisma
Database: MySQL

/_ ----------------Flutter 앱에 Firebase 추가----------------_/
FlutterFire CLI 설치 및 실행

1. dart pub global activate flutterfire_cli (디렉터리에서)
2. flutterfire configure --project=smembers-23ddc ( Flutter 프로젝트 디렉터리의 루트에서 )

Firebase 초기화 및 플러그인 추가 -Firebase를 초기화하려면 새 firebase_options.dart 파일의 구성으로 firebase_core 패키지에서 Firebase.initializeApp을 호출합니다.
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

// ...

await Firebase.initializeApp(
options: DefaultFirebaseOptions.currentPlatform,
);

firebase SDK

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
apiKey: "AIzaSyDNey2NHb6kRdjH2_dY-uD5qRfCpHdI9cQ",
authDomain: "smembers-23ddc.firebaseapp.com",
projectId: "smembers-23ddc",
storageBucket: "smembers-23ddc.appspot.com",
messagingSenderId: "269273974749",
appId: "1:269273974749:web:b4e1d8e2d2dfac7f639834",
measurementId: "G-7Y2XJS8XZN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

TODO: SWAGGER
https://github.com/jellydn/next-swagger-doc
문제점 현재의 라우터 방식으론 어려운 부분이 있음
