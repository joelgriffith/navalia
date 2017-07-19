import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLObjectType,
} from 'graphql';
import { domArgs } from '../dom-types';

export const focus = {
  type: new GraphQLObjectType({
    name: 'focus',
    fields: () => ({
      focused: {
        type: GraphQLBoolean,
        description: `Whether or not the selector was focused`,
      },
    }),
  }),
  description: `The focus method focuses an element on the page. It accepts a css-style selector of the element you wish to focus.`,
  args: {
    ...domArgs,
    selector: {
      description: `The selector you want to target (eg: '.buy-it-now')`,
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome
        .focus(args.selector, { wait: args.wait, timeout: args.timeout })
        .then(focused => {
          return { focused };
        });
    });
  },
};
