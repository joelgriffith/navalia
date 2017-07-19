#!/usr/bin/env node
const { start } = require('../build/graphql/server');
const { argv } = require('yargs');

start(argv.port || 4000);
