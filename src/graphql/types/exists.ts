import { GraphQLString, GraphQLNonNull, GraphQLBoolean } from 'graphql';

export const exists = {
  type: GraphQLBoolean,
  description: `The exists method returns if the Element exists on the page. Accepts a string of a css-style selector.`,
  args: {
    selector: {
      description: `The selector you want to target (eg: '.buy-it-now')`,
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.exists(args.selector);
    });
  },
};
