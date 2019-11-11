const { functions } = require('../src/functions');
const mcore = require('@cedalo/machine-core');
const { SheetParser } = require('../src/machinecore').set(mcore);

// setup parser and its context...
Object.assign(SheetParser.context.functions, functions);
