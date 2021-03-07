import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';
import { renderMailHtml } from 'src/utils/mail/mail';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    const { name, mailSender: sender } = configService.get();
    const { activeCodeExpiration } = configService.get('security');
    this.expirationMinutes = Math.floor(activeCodeExpiration / 60000);
    this.name = name;
    this.sender = sender;
  }

  private helpMessage = '需要任何帮助吗？请使用电子邮件联系';
  private name: string;
  private sender: string;
  private expirationMinutes: number;

  async sendRegisterMail(emails: string[], link: string) {
    for (const email of emails) {
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
            content: `这个链接仅在 ${this.expirationMinutes} 分钟内有效`,
          },
        ]),
      });
    }
  }

  async sendResetPasswordMail(emails: string[], link: string) {
    for (const email of emails) {
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
            content: `这个链接仅在 ${this.expirationMinutes} 分钟内有效`,
          },
          {
            type: 'paragraph',
            content:
              '如果你没有申请重置你的 ExamPro 账户密码，请不要进行任何操作',
          },
        ]),
      });
    }
  }

  async sendChangeEmailMail(emails: string[], link: string) {
    for (const email of emails) {
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
              content: `这个链接仅在 ${this.expirationMinutes} 分钟内有效`,
            },
          ],
        ),
      });
    }
  }
}
