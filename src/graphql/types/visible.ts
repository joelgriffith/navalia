import { GraphQLBoolean, GraphQLString, GraphQLNonNull } from 'graphql';

export const visible = {
  type: GraphQLBoolean,
  description: `The visible method returns a boolean indiciating if an element is visible. It accepts a single argument: the css-style of the selector you want to check.`,
  args: {
    selector: {
      description: `The selector you want to target (eg: '.buy-it-now')`,
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.visible(args.selector);
    });
  },
};
