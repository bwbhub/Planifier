import { userProcedure } from "../../../procedures";

export const meRouter = {
  // Liste blanche explicite : le contexte pourra porter plus que ce que le contrat expose.
  get: userProcedure.account.me.get.handler(async ({ context }) => {
    const { user } = context;
    const { modules } = await context
      .getDb()
      .user.findUniqueOrThrow({ where: { id: user.id }, select: { modules: true } });
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      preferredTheme: user.preferredTheme,
      modules,
    };
  }),

  setModules: userProcedure.account.me.setModules.handler(({ context, input }) =>
    context.getDb().user.update({
      where: { id: context.user.id },
      data: { modules: input.modules },
      select: { modules: true },
    }),
  ),
};
