import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, context: ExecutionContext) => {
    const user = context.switchToHttp().getRequest().user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
