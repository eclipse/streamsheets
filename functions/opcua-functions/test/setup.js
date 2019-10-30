const { functions: opcuaFunctions } = require('..');
const { functions: coreFunctions } = require('@cedalo/functions');
const { SheetParser } = require('@cedalo/machine-core');


// setup parser and its context...
Object.assign(SheetParser.context.functions, coreFunctions, opcuaFunctions );
