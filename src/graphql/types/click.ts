import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';
import { domArgs } from '../dom-types';

export const click = {
  type: new GraphQLObjectType({
    name: 'click',
    fields: () => ({
      clicked: {
        type: GraphQLBoolean,
        description: `Boolean representing if the click was successful`,
      },
    }),
  }),
  description: `The click method clicks on an element on the page. It accepts a css-style selector for the element you want to click. Returns a boolean indicating success`,
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
        .click(args.selector, { wait: args.wait, timeout: args.timeout })
        .then(clicked => {
          return { clicked };
        });
    });
  },
};
