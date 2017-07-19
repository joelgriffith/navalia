import { GraphQLString, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { domArgs } from '../dom-types';

export const text = {
  type: new GraphQLObjectType({
    name: `text`,
    fields: () => ({
      text: {
        type: GraphQLString,
        description: `The text inside of the selector`,
      },
    }),
  }),
  description: `The text method returns the inside-text of a DOM node (including its children’s text) as a string. It accepts one argument: a css-selector string, and defaults to body when none is present.`,
  args: {
    ...domArgs,
    selector: {
      description: `The selector you want to get the text of`,
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome
        .text(args.selector, { wait: args.wait, timeout: args.timeout })
        .then(text => {
          return { text };
        });
    });
  },
};
