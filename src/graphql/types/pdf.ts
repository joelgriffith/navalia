import { GraphQLString, GraphQLObjectType } from 'graphql';

export const pdf = {
  type: new GraphQLObjectType({
    name: 'pdf',
    fields: () => ({
      pdf: {
        type: GraphQLString,
        description: `The resulting PDF as a base64 string`,
      },
    }),
  }),
  description: `The pdf method will return a base-64 encoded string for usage in saving`,
  resolve(_, _args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.pdf().then(buffer => {
        return { pdf: buffer.toString('base64') };
      });
    });
  },
};
