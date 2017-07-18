import { GraphQLBoolean, GraphQLString, GraphQLNonNull } from 'graphql';

export const uncheck = {
  type: GraphQLBoolean,
  description: `The uncheck method un-checks a checkbox. It accepts a single argument: the css-style selector of the checkbox you want to un-check`,
  args: {
    selector: {
      description: `The selector you want to target (eg: '.buy-it-now')`,
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.uncheck(args.selector);
    });
  },
};
