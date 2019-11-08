const { functions } = require('../src/functions');
const { SheetParser } = require('@cedalo/machine-core');

// setup parser and its context...
Object.assign(SheetParser.context.functions, functions);
