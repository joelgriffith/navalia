import { GraphQLString, GraphQLObjectType } from 'graphql';
import { domArgs } from '../dom-types';

export const html = {
  type: new GraphQLObjectType({
    name: 'html',
    fields: () => ({
      html: {
        type: GraphQLString,
        description: `The resulting HTML from the query`,
      },
    }),
  }),
  description: `The html method returns the string of HTML for a particular selector. It accepts one argument: a css-style selector for the element you wish to extract html from.`,
  args: {
    ...domArgs,
    selector: {
      description: `The css-style selector you wish to query for`,
      type: GraphQLString,
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome
        .html(args.selector, { wait: args.wait, timeout: args.timeout })
        .then(html => {
          return { html };
        });
    });
  },
};
