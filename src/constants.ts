// POST Body 中需要 email 字段
export const ERR_BODY_EMAIL_REQUIRED = 'ERR_BODY_EMAIL_REQUIRED';

// POST Body 中需要 password 字段
export const ERR_BODY_PASSWORD_REQUIRED = 'ERR_BODY_PASSWORD_REQUIRED';

// 验证码超时失效
export const ERR_ACTIVE_CODE_EXPIRED = 'ERR_ACTIVE_CODE_EXPIRED';

// 验证码错误
export const ERR_ACTIVE_CODE_INVALID = 'ERR_ACTIVE_CODE_INVALID';

// 账户不存在
export const ERR_ACCOUNT_NOT_FOUND = 'ERR_ACCOUNT_NOT_FOUND';

// 账户已激活
export const ERR_ACCOUNT_REPEATED_ACTIVATION_DETECTED =
  'ERR_ACCOUNT_REPEATED_ACTIVATION_DETECTED';

// 账号或密码错误
export const ERR_AUTHENTICATION_FAILED = 'ERR_AUTHENTICATION_FAILED';

// 用户未激活
export const ERR_USER_INACTIVE = 'ERR_USER_INACTIVE';

// 用户被封禁
export const ERR_USER_BANNED = 'ERR_USER_BANNED';

// =================== 封禁状态 ===================

/**
 * 用户在考试中存在以下一种或多种行为
 * - 舞弊
 * - 协助他人舞弊
 * - 多次离开浏览器标签页
 * 如有在考试时通过系统辱骂、语言攻击监考人员等行为，则应当使用 BAN_VIOLATION
 */
export const BAN_FRAUD = 'BAN_FRAUD';

/**
 * 用户或试卷存在以下一种或多种行为或内容
 * - 骚扰/辱骂
 * - 性别歧视
 * - 种族歧视
 * - 政治敏感
 * - 发布色情内容
 * - 发布毒品交易信息/交易毒品
 * - 博彩/违法开设赌场
 * - 颠覆国家政权
 * - 宣扬、煽动暴力和恐怖主义
 * - 破坏宗教信仰自由/违法传播宗教
 * - 发布血腥内容
 * - 诋毁革命烈士
 * - 侵犯著作权、肖像权
 * - 其他违法行为
 */
export const BAN_VIOLATION = 'BAN_VIOLATION';
