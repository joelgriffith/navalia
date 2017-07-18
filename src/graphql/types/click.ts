import { GraphQLBoolean, GraphQLString, GraphQLNonNull } from 'graphql';

export const click = {
  type: GraphQLBoolean,
  description: `The click method clicks on an element on the page. It accepts a css-style selector for the element you want to click. Returns a boolean indicating success`,
  args: {
    selector: {
      description: `The selector you want to target (eg: '.buy-it-now')`,
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.click(args.selector);
    });
  },
};
