import { GraphQLSchema, GraphQLObjectType } from 'graphql';

import { attr } from './types/attr';
import { check } from './types/check';
import { click } from './types/click';
import { cookie } from './types/cookie';
import { coverage } from './types/coverage';
import { exists } from './types/exists';
import { focus } from './types/focus';
import { goto } from './types/goto';
import { html } from './types/html';
import { pageload } from './types/pageload';
import { pdf } from './types/pdf';
import { screenshot } from './types/screenshot';
import { text } from './types/text';
import { type } from './types/type';
import { uncheck } from './types/uncheck';
import { visible } from './types/visible';
import { wait } from './types/wait';

export const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Browser',
    description: `All the various browser-related interactions can be queried here.`,
    fields: () => ({
      attr,
      check,
      click,
      cookie,
      coverage,
      exists,
      focus,
      goto,
      html,
      pageload,
      pdf,
      screenshot,
      text,
      type,
      uncheck,
      visible,
      wait,
    }),
  }),
});
