import { GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql';

export const cookie = {
  type: new GraphQLList(
    new GraphQLObjectType({
      name: 'cookie',
      fields: () => ({
        name: {
          type: GraphQLString,
        },
        value: {
          type: GraphQLString,
        },
      }),
    }),
  ),
  description: `The check method checks a checkbox. It accepts a single argument: the css-style selector of the checkbox you want to check.`,
  args: {
    name: {
      description: `The name of the cookie you want to get or set`,
      type: GraphQLString,
    },
    value: {
      description: `The value of the cookie you want to set`,
      type: GraphQLString,
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.cookie(args.name, args.value);
    });
  },
};
