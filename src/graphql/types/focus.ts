import { GraphQLString, GraphQLNonNull, GraphQLBoolean } from 'graphql';

export const focus = {
  type: GraphQLBoolean,
  description: `The focus method focuses an element on the page. It accepts a css-style selector of the element you wish to focus.`,
  args: {
    selector: {
      description: `The selector you want to target (eg: '.buy-it-now')`,
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.focus(args.selector);
    });
  },
};
