import { GraphQLBoolean, GraphQLFloat } from 'graphql';

export const domArgs = {
  wait: {
    description: `Wait for the element before executing`,
    type: GraphQLBoolean,
    defaultValue: false,
  },
  timeout: {
    description: `The amount of time to wait before failing.`,
    type: GraphQLFloat,
    defaultValue: 10000,
  },
};
