import {
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql';
import { domArgs } from '../dom-types';

export const uncheck = {
  type: new GraphQLObjectType({
    name: 'uncheck',
    fields: () => ({
      unchecked: {
        type: GraphQLBoolean,
        description: `Whether or not the uncheck was successful`,
      },
    }),
  }),
  description: `The uncheck method un-checks a checkbox. It accepts a single argument: the css-style selector of the checkbox you want to un-check`,
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
        .uncheck(args.selector, { wait: args.wait, timeout: args.timeout })
        .then(unchecked => {
          return { unchecked };
        });
    });
  },
};
