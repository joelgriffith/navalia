import { GraphQLBoolean, GraphQLString, GraphQLNonNull } from 'graphql';

export const check = {
  type: GraphQLBoolean,
  description: `The check method checks a checkbox. It accepts a single argument: the css-style selector of the checkbox you want to check.`,
  args: {
    selector: {
      description: `The selector you want to target (eg: '.buy-it-now')`,
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.check(args.selector);
    });
  },
};
