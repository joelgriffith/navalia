import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
} from 'graphql';
import { domArgs } from '../dom-types';

export const exists = {
  type: new GraphQLObjectType({
    name: 'exists',
    fields: () => ({
      exists: {
        type: GraphQLBoolean,
        description: `If the selector was found on the page`,
      },
    }),
  }),
  description: `The exists method returns if the Element exists on the page. Accepts a string of a css-style selector.`,
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
        .exists(args.selector, { wait: args.wait, timeout: args.timeout })
        .then(exists => {
          return { exists };
        });
    });
  },
};
