const { functions } = require('../src/functions');
const { SheetParser, SheetParserContext } = require('@cedalo/machine-core');

// setup parser and its context...
SheetParser.context = new SheetParserContext().registerFunctions(functions);
