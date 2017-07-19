import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLFloat,
  GraphQLObjectType,
  GraphQLList,
} from 'graphql';

export const coverage = {
  type: new GraphQLList(
    new GraphQLObjectType({
      name: 'coverage',
      fields: () => ({
        total: {
          type: GraphQLFloat,
        },
        unused: {
          type: GraphQLFloat,
        },
        percentUnused: {
          type: GraphQLFloat,
        },
      }),
    }),
  ),
  description: `The coverage method checks the coverage info for a particular resource (JS or CSS). In order to collect coverage, you must query goto with a second parameter of { coverage: true }. This is so that Navalia can properly instrument Chrome to collect coverage.`,
  args: {
    resource: {
      description: `The resource you want to check coverage on (CSS or JS)`,
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.coverage(args.resource).then(coverage => [coverage]);
    });
  },
};
