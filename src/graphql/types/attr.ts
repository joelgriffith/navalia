import { GraphQLString, GraphQLNonNull } from 'graphql';

export const attr = {
  type: GraphQLString,
  description: `The attr method operates similarly to the jQuery attr method, and return the value of an attribute of a DOM element. It’s called with 2 parameters: the css-style selector of the element you wish to query, and the attribute you want to retrieve.`,
  args: {
    selector: {
      description: `The selector you want to target (eg: '.buy-it-now')`,
      type: new GraphQLNonNull(GraphQLString),
    },
    attribute: {
      description: `The attribute you want`,
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.attr(args.selector, args.attribute);
    });
  },
};
