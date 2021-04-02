export interface IRole {
  name: string;
  order?: number;
  children?: Array<IRole>;
}

export const generateRoles = (): IRole[] => {
  return [
    {
      name: 'user',
      children: [
        { name: 'normal' },
        {
          name: 'admin',
          children: [
            { name: 'system' },
            { name: 'user' },
            { name: 'report' },
            { name: 'layout' },
            { name: 'role' },
            { name: 'resource' },
          ],
        },
      ],
    },
    {
      name: 'resource',
      children: [
        {
          name: 'question_base',
          children: [
            { name: 'owner', order: 1 },
            { name: 'maintainer', order: 2 },
            { name: 'member', order: 3 },
          ],
        },
        {
          name: 'paper',
          children: [
            { name: 'owner', order: 1 },
            { name: 'maintainer', order: 2 },
          ],
        },
        {
          name: 'exam',
          children: [
            { name: 'initiator', order: 2 },
            { name: 'maintainer', order: 3 },
            { name: 'invigilator', order: 4 },
            { name: 'participant', order: 1 },
            { name: 'reviewer', order: 5 },
          ],
        },
      ],
    },
  ];
};

export const generateReportTypes = () => {
  return [
    // 舞弊
    '000',
    // 协助他人舞弊
    '010',
    // 多次离开标签页
    '020',
    // 传播垃圾广告信息
    '100',
    // 违背事实信息
    '200',
    // 传播社会谣言信息
    '210',
    // 辱骂、人身攻击
    '300',
    // 政治敏感
    '400',
    // 色情低俗
    '410',
    // 意图自杀或自残
    '420',
    // 违法违规
    '430',
    // 封建迷信
    '440',
  ];
};
