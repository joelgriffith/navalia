#!/usr/bin/env node
const { start } = require('../build/graphql/server');
const port = process.argv.length === 3 ? process.argv[process.argv.length - 1] : 4000;

start(port);
