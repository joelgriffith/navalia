import { GraphQLBoolean, GraphQLString, GraphQLNumber } from 'graphql';

export const visible = {
  type: GraphQLBoolean,
  description: `The wait method accepts either a selector to wait for, or time in MS, before allowing Chrome to continue execution.`,
  args: {
    selector: {
      description: `The selector you want to wait for (eg: '.buy-it-now')`,
      type: GraphQLString,
    },
    time: {
      description: `The time to wait in milli-seconds`,
      type: GraphQLNumber,
    },
  },
  resolve(_, args, context) {
    const { loader } = context;

    return loader.run(chrome => {
      return chrome.wait(args.selector || args.time);
    });
  },
};
