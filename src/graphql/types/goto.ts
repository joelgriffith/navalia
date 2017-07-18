import { GraphQLBoolean, GraphQLString, GraphQLNonNull } from 'graphql';

export const goto = {
  type: GraphQLBoolean,
  description: `Navigates the browser to the webpage specified via the 'url' argument. Returns a boolean indicating success`,
  args: {
    url: {
      description: `The page or website you want to navigate to`,
      type: new GraphQLNonNull(GraphQLString),
    },
    coverage: {
      type: GraphQLBoolean,
      defaultValue: false,
      description: `Tools the browser to collect coverage information on a downstream request`,
    },
    pageload: {
      type: GraphQLBoolean,
      defaultValue: true,
      description: `Wether or not to wait for the 'pageload' event before proceeding`,
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(async chrome => {
      return chrome.goto(args.url, {
        coverage: args.coverage,
        pageload: args.pageload,
      });
    });
  },
};
