export interface IRole {
  name: string;
  children?: Array<IRole>;
}

export const generateRoles = () => {
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
            { name: 'owner' },
            { name: 'maintainer' },
            { name: 'member' },
          ],
        },
        {
          name: 'paper',
          children: [{ name: 'owner' }, { name: 'maintainer' }],
        },
        {
          name: 'exam',
          children: [
            { name: 'initiator' },
            { name: 'maintainer' },
            { name: 'invigilator' },
            { name: 'participant' },
            { name: 'reviewer' },
          ],
        },
      ],
    },
  ];
};
