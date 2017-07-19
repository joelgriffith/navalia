import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';

import { schema } from './schema';
import { ChromeLoader } from './ChromeLoader';

const start = (port = 4000) => {
  const app = express();

  app.use(
    '/',
    graphqlHTTP(() => {
      const start = Date.now();

      return {
        schema,
        graphiql: true,
        context: {
          loader: new ChromeLoader(),
        },
        extensions: () => ({
          time: Date.now() - start,
        }),
      };
    }),
  );

  app.listen(port, () =>
    console.log(`Navalia is ready at: http://127.0.0.1:${port}`),
  );
};

if (module.parent) {
  module.exports.start = start;
} else {
  start();
}
