import { GraphQLString, GraphQLObjectType } from 'graphql';

export const screenshot = {
  type: new GraphQLObjectType({
    name: 'screenshot',
    fields: () => ({
      screenshot: {
        type: GraphQLString,
        description: `The base64 encoded PNG of the screenshot.`,
      },
    }),
  }),
  description: `The screenshot method will return a base-64 encoded string representing a png of the site`,
  resolve(_, _args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.screenshot().then(buffer => {
        return { screenshot: buffer.toString('base64') };
      });
    });
  },
};
