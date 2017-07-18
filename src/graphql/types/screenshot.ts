import { GraphQLString } from 'graphql';

export const screenshot = {
  type: GraphQLString,
  description: `The screenshot method will return a base-64 encoded string representing a png of the site`,
  resolve(_, _args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.screenshot().then(buffer => {
        return buffer.toString('base64');
      });
    });
  },
};
