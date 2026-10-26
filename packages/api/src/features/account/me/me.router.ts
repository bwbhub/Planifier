import { userProcedure } from "../../../procedures";

export const meRouter = {
  // Liste blanche explicite : le contexte pourra porter plus que ce que le contrat expose.
  get: userProcedure.account.me.get.handler(({ context: { user } }) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    preferredTheme: user.preferredTheme,
  })),
};
