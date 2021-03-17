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

export const ERR_ACCOUNT_STATUS_INVALID = 'ERR_ACCOUNT_STATUS_INVALID';

// 账户已激活
export const ERR_ACCOUNT_REPEATED_ACTIVATION_DETECTED =
  'ERR_ACCOUNT_REPEATED_ACTIVATION_DETECTED';

// 账号或密码错误
export const ERR_AUTHENTICATION_FAILED = 'ERR_AUTHENTICATION_FAILED';

// 用户未激活
export const ERR_USER_INACTIVE = 'ERR_USER_INACTIVE';

// 用户被封禁
export const ERR_USER_BANNED = 'ERR_USER_BANNED';

// 用户邮箱已占用
export const ERR_EMAIL_DUPLICATED = 'ERR_EMAIL_DUPLICATED';

// 角色不存在
export const ERR_ROLE_NOT_FOUND = 'ERR_ROLE_NOT_FOUND';

// 菜单项不存在
export const ERR_MENU_NOT_FOUND = 'ERR_MENU_NOT_FOUND';

// 无法指定父级目录为自身
export const ERR_MENU_PARENT_CIRCLED = 'ERR_MENU_PARENT_CIRCLED';

// 角色 ID 被占用
export const ERR_ROLE_ID_DUPLICATED = 'ERR_ROLE_ID_DUPLICATED';

// 无权限修改题目
export const ERR_QUESTION_MODIFICATION_PROHIBITED =
  'ERR_QUESTION_MODIFICATION_PROHIBITED';

// 试题未找到
export const ERR_QUESTION_NOT_FOUND = 'ERR_QUESTION_NOT_FOUND';

// 试题类型不允许出现选项
export const ERR_CHOICES_NOT_ALLOWED = 'ERR_CHOICES_NOT_ALLOWED';

// 用户未设置密码
export const ERR_USER_PASSWORD_NOT_SET = 'ERR_USER_PASSWORD_NOT_SET';

// 用户已存在
export const ERR_ACCOUNT_EXISTED = 'ERR_ACCOUNT_EXISTED';

// 需要验证邮箱
export const ERR_EMAIL_VERIFICATION_REQUIRED =
  'ERR_EMAIL_VERIFICATION_REQUIRED';

// 旧密码不匹配
export const ERR_OLD_PASSWORD_MISMATCHED = 'ERR_OLD_PASSWORD_MISMATCHED';

// 不是该场考试的考生
export const ERR_NOT_PARTICIPANT = 'ERR_NOT_PARTICIPANT';

// 已确认考试，不可重复确认
export const ERR_DUPLICATED_CONFIRMATION_PROHIBITED =
  'ERR_DUPLICATED_CONFIRMATION_PROHIBITED';

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
