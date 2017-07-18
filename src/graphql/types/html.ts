import { GraphQLString } from 'graphql';

export const html = {
  type: GraphQLString,
  description: `The html method returns the string of HTML for a particular selector. It accepts one argument: a css-style selector for the element you wish to extract html from.`,
  args: {
    selector: {
      description: `The css-style selector you wish to query for`,
      type: GraphQLString,
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.html(args.selector);
    });
  },
};
