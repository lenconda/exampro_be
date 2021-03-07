import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

export interface Section {
  type: 'paragraph' | 'link' | 'buttonLink';
  content?: string;
  link?: string;
  text?: string;
}

export const renderMailHtml = (
  title: string,
  helpMessage: string,
  sections: Section[],
) => {
  return ejs.render(
    fs.readFileSync(path.resolve('src/utils/mail/template.html')).toString(),
    {
      sections,
      title,
      helpMessage,
    },
  );
};
