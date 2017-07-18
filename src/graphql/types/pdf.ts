import { GraphQLString } from 'graphql';

export const pdf = {
  type: GraphQLString,
  description: `The pdf method will return a base-64 encoded string for usage in saving`,
  resolve(_, _args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.pdf().then(buffer => {
        return buffer.toString('base64');
      });
    });
  },
};
