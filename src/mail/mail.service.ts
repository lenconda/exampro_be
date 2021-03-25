import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';
import { renderMailHtml } from 'src/utils/mail/mail';
import qs from 'query-string';
import _ from 'lodash';
import { Exam } from 'src/exam/exam.entity';

export interface RegisterUsers {
  email: string;
  token: string;
}

export interface ExamConfirmation {
  email: string;
  exam: Exam;
  token?: string;
}

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    const { name, mailSender: sender, hostname } = configService.get();
    this.name = name;
    this.sender = sender;
    this.hostname = hostname;
  }

  private helpMessage = '需要任何帮助吗？请使用电子邮件联系';
  private name: string;
  private sender: string;
  private hostname: string;

  async sendRegisterMail(items: RegisterUsers[]) {
    for (const item of items) {
      const { token, email } = item;
      const link = `${this.hostname}/user/complete?token=${token}&type=registration`;
      const resendLink = `${this.hostname}/user/resend?type=register`;
      this.mailerService.sendMail({
        to: email,
        from: this.sender,
        subject: `[${this.name}] 验证你的邮箱`,
        html: await renderMailHtml('欢迎注册 ExamPro', this.helpMessage, [
          {
            type: 'paragraph',
            content: '我们已经收到了你创建账户的请求，欢迎你的到来。',
          },
          {
            type: 'paragraph',
            content:
              '单击下面的按钮以验证你用于创建账户的邮箱。验证完成后，你便可以正常使用 ExamPro 服务：',
          },
          {
            type: 'buttonLink',
            text: '验证邮箱',
            link,
          },
          {
            type: 'paragraph',
            content: '如果上面的按钮无法点击，请直接打开下面的链接：',
          },
          {
            type: 'link',
            link,
          },
          {
            type: 'paragraph',
            content: `这个链接在 7 日内有效。请勿将邮件中的任何链接告知他人。`,
          },
          {
            type: 'buttonLink',
            text: '再次发送',
            link: resendLink,
          },
        ]),
      });
    }
  }

  async sendResetPasswordMail(email: string, token: string) {
    const link = `${this.hostname}/user/complete?token=${token}&type=forget_password`;
    const resendLink = `${this.hostname}/user/resend?type=reset_password`;
    this.mailerService.sendMail({
      to: email,
      from: this.sender,
      subject: `[${this.name}] 重置你的密码`,
      html: await renderMailHtml('重置你的 ExamPro 密码', this.helpMessage, [
        {
          type: 'paragraph',
          content:
            '我们已经收到了你重置账户密码的请求，请单击下面的按钮来访问重置密码页面：',
        },
        {
          type: 'buttonLink',
          text: '重置密码',
          link,
        },
        {
          type: 'paragraph',
          content: '如果上面的按钮无法点击，请直接打开下面的链接：',
        },
        {
          type: 'link',
          link,
        },
        {
          type: 'paragraph',
          content: `这个链接仅在 7 日内有效。请勿将邮件中的任何链接告知他人。`,
        },
        {
          type: 'paragraph',
          content:
            '如果你没有申请重置你的 ExamPro 账户密码，请不要进行任何操作',
        },
        {
          type: 'buttonLink',
          text: '再次发送',
          link: resendLink,
        },
      ]),
    });
  }

  async sendChangeEmailMail(email: string, token: string) {
    const link = `${this.hostname}/user/verify_email?token=${token}`;
    const resendLink = `${this.hostname}/user/resend?type=verify_email`;
    this.mailerService.sendMail({
      to: email,
      from: this.sender,
      subject: `[${this.name}] 验证你的新邮箱`,
      html: await renderMailHtml(
        '验证用于使用 ExamPro 服务的新邮箱',
        this.helpMessage,
        [
          {
            type: 'paragraph',
            content:
              '你在不久前更换了使用 ExamPro 服务的新邮箱，因此你收到了这封邮件。',
          },
          {
            type: 'paragraph',
            content:
              '单击下面的按钮以验证你用于创建账户的邮箱。验证完成后，你便可以正常使用 ExamPro 服务：',
          },
          {
            type: 'buttonLink',
            text: '验证邮箱',
            link,
          },
          {
            type: 'paragraph',
            content: '如果上面的按钮无法点击，请直接打开下面的链接：',
          },
          {
            type: 'link',
            link,
          },
          {
            type: 'paragraph',
            content: `这个链接仅在 7 日内有效。请勿将邮件中的任何链接告知他人。`,
          },
          {
            type: 'buttonLink',
            text: '再次发送',
            link: resendLink,
          },
        ],
      ),
    });
  }

  async sendExamConfirmationMail(items: ExamConfirmation[]) {
    for (const item of items) {
      const { email, exam } = item;
      const queries = _(item)
        .pick(['token'])
        .omitBy(_.isNull)
        .omitBy(_.isUndefined)
        .value() as Record<string, any>;
      queries.exam = exam.id;
      const confirmLink = `${this.hostname}/exam/confirm?${qs.stringify(
        queries,
      )}&type=confirm`;
      const cancelLink = `${this.hostname}/exam/confirm?${qs.stringify(
        queries,
      )}&type=cancel`;
      this.mailerService.sendMail({
        to: email,
        from: this.sender,
        subject: `[${this.name}] 确认你的考试信息`,
        html: await renderMailHtml(
          `请确认你是否参加 [${exam.title}]`,
          this.helpMessage,
          _.compact([
            {
              type: 'paragraph',
              content:
                '你被列入这次考试的参与考试名单中，因此你收到了这封邮件。',
            },
            {
              type: 'paragraph',
              content: '本场考试的安排如下：',
            },
            (exam.startTime && {
              type: 'paragraph',
              content: `开始时间: ${exam.startTime.toLocaleString()}`,
            }) ||
              null,
            {
              type: 'paragraph',
              content: `结束时间: ${exam.endTime.toLocaleString()}`,
            },
            {
              type: 'paragraph',
              content: `考试时长: ${
                exam.duration ? `${exam.duration}分钟` : '不限时'
              }`,
            },
            {
              type: 'buttonLink',
              text: '确认参加',
              link: confirmLink,
            },
            {
              type: 'buttonLink',
              text: '放弃考试',
              link: confirmLink,
            },
            {
              type: 'paragraph',
              content: '如果上面的按钮无法点击，请直接打开下面的链接：',
            },
            {
              type: 'paragraph',
              content: '确认参加',
            },
            {
              type: 'link',
              link: confirmLink,
            },
            {
              type: 'paragraph',
              content: '放弃考试',
            },
            {
              type: 'link',
              link: cancelLink,
            },
          ]),
        ),
      });
    }
  }
}
