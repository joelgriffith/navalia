import { GraphQLString, GraphQLNonNull } from 'graphql';

export const inject = {
  type: GraphQLString,
  description: `The inject method injects a JavaScript or CSS file into the page. It accpets a single-argument: a string of the filepath to inject.`,
  args: {
    path: {
      description: `The file-system path for the script you wish to inject`,
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.inject(args.path);
    });
  },
};
