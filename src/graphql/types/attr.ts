import { GraphQLString, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { domArgs } from '../dom-types';

export const attr = {
  type: new GraphQLObjectType({
    name: 'attr',
    fields: () => ({
      value: {
        type: GraphQLString,
        description: `The value of the attribute you've queried for.`,
      },
    }),
  }),
  description: `The attr method operates similarly to the jQuery attr method, and return the value of an attribute of a DOM element. It’s called with 2 parameters: the css-style selector of the element you wish to query, and the attribute you want to retrieve.`,
  args: {
    ...domArgs,
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
      return chrome
        .attr(args.selector, args.attribute, {
          wait: args.wait,
          timeout: args.timeout,
        })
        .then(value => {
          return { value };
        });
    });
  },
};
