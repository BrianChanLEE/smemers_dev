import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();
import Logger from '@/src/middleware/logger';
const logger = new Logger('logs');
export async function sendVerificationEmail(
  to: string,
  verificationCode: string,
) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_ID,
        pass: process.env.SMT_PWD,
      },
    });

    console.log('transporter: ', transporter);

    const mailOptions = {
      from: process.env.MAIL_ID,
      to: to,
      subject: '인증 코드',
      text: `당신의 인증 코드는: ${verificationCode}`,
    };

    const emailSendResult = await transporter.sendMail(mailOptions);

    if (emailSendResult.response.includes('250')) {
      logger.info('이메일 전송 성공');
      return {
        success: true,
        message: '이메일 전송 성공',
      };
    } else {
      logger.info('인증 코드 전송 실패');
      return {
        success: false,
        message: '인증 코드 전송 실패',
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`이메일 전송 중 오류 발생: ${error.message}`);
      return {
        success: false,
        message: '이메일 전송 중 오류 발생',
      };
    }

    logger.error('이메일 전송 중 예상치 못한 오류 발생');
    return {
      success: false,
      message: '이메일 전송 중 예상치 못한 오류 발생',
    };
  }
}
