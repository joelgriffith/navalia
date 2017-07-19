import { GraphQLBoolean } from 'graphql';

export const pageload = {
  type: GraphQLBoolean,
  description: `The pageload query halts execution until the pageload event is fired. This can be effectively used to block further actions until a pageload has hit (for instance multi-page workflows).`,
  resolve(_, _args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.pageload();
    });
  },
};
