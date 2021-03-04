export interface IRole {
  name: string;
  children?: Array<IRole>;
}

export const generateRoles = () => {
  return [
    {
      name: 'user',
      children: [
        { name: 'system' },
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
            { name: 'invigilator' },
            { name: 'participant' },
          ],
        },
      ],
    },
    {
      name: 'admin',
      children: [
        { name: 'system' },
        { name: 'user' },
        { name: 'report' },
        { name: 'layout' },
      ],
    },
  ];
};
