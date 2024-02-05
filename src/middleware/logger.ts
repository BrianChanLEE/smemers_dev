import winston, { createLogger, format, transports } from "winston";
import path from "path";

// 사용자 지정 로그 레벨에 대한 색상 설정
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    db: 5,
    sys: 6,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "blue",
    db: "cyan",
    sys: "grey",
  },
};

winston.addColors(customLevels.colors);
class Logger {
  private logger: winston.Logger;

  constructor(logDir: string) {
    this.logger = winston.createLogger({
      levels: customLevels.levels, // 로그 레벨을 'info'로 설정
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss",
        }), // 로그에 타임스탬프를 추가
        winston.format.printf((info) => {
          const koreaTime = new Date(info.timestamp); // 수정: 'info.timestamp'로 변경
          koreaTime.setHours(koreaTime.getHours() + 9);
          return `${koreaTime
            .toISOString()
            .replace("T", " ")
            .substring(0, 19)} ${info.level}: ${info.message}`;
        }),
        winston.format.json(), // 로그 메시지를 JSON 형식으로 포맷
      ),
      transports: [
        new winston.transports.File({ filename: path.join(logDir, "app.log") }), // 로그를 파일에 저장
        new winston.transports.Console({
          format: winston.format.simple(), // 콘솔에 간단한 형식으로 로그 출력
        }),
      ],
    });

    // 개발 환경이 아닌 경우, 콘솔에도 로그를 출력합니다.
    if (process.env.NODE_ENV !== "production") {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.simple(), // 콘솔에 간단한 형식으로 로그 출력
        }),
      );
    }
  }

  // 'info' 로그 레벨로 로그 메시지를 기록합니다.
  info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  // 'warn' 로그 레벨로 로그 메시지를 기록합니다.
  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  // 'error' 로그 레벨로 로그 메시지를 기록합니다.
  error(message: string, meta?: any) {
    this.logger.error(message, meta);
  }

  // 'debug' 로그 레벨로 로그 메시지를 기록합니다.
  o(message: string, meta?: any) {
    this.logger.debug(message, meta);
  }

  // HTTP 요청에 관한 로그 메시지를 기록합니다.
  http(message: string, meta?: any) {
    this.logger.http(message, meta);
  }

  // 데이터베이스 작업에 관한 로그 메시지를 기록합니다.
  db(message: string, meta?: any) {
    this.logger.log({ level: "db", message, meta });
  }

  // 시스템 이벤트에 관한 로그 메시지를 기록합니다.
  sys(message: string, meta?: any) {
    this.logger.log({ level: "sys", message, meta });
  }

  // 사용자 정의 로그 레벨로 로그 메시지를 기록합니다.
  custom(level: string, message: string, meta?: any) {
    this.logger.log({ level, message, meta });
  }
}

export default Logger;
