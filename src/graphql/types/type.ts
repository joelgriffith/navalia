import { GraphQLString, GraphQLNonNull, GraphQLBoolean } from 'graphql';

export const type = {
  type: GraphQLBoolean,
  description: `The type method allows you to type text into an element. It accepts two arguments: the css-style selector of the element you want to enter text into, and a string of text to input.`,
  args: {
    selector: {
      description: `The selector of the element you wish to type into`,
      type: new GraphQLNonNull(GraphQLString),
    },
    text: {
      description: `The text you want to type into the element`,
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.type(args.selector, args.text);
    });
  },
};
