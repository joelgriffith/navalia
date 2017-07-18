import { GraphQLString, GraphQLNonNull } from 'graphql';

export const text = {
  type: GraphQLString,
  description: `The text method returns the inside-text of a DOM node (including its children’s text) as a string. It accepts one argument: a css-selector string, and defaults to body when none is present.`,
  args: {
    selector: {
      description: `The selector you want to get the text of`,
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.text(args.selector);
    });
  },
};
