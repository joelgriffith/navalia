import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';
import { domArgs } from '../dom-types';

export const visible = {
  type: new GraphQLObjectType({
    name: 'visible',
    fields: () => ({
      visible: {
        type: GraphQLBoolean,
        description: `Whether or not the selector is visible.`,
      },
    }),
  }),
  description: `The visible method returns a boolean indiciating if an element is visible. It accepts a single argument: the css-style of the selector you want to check.`,
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
        .visible(args.selector, { wait: args.wait, timeout: args.timeout })
        .then(visible => {
          return { visible };
        });
    });
  },
};
