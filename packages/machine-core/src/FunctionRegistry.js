const Functions = require('./functions');
const { streamFunc } = require('./functions/_utils/func');
const { SheetParser } = require('./parser/SheetParser');
const SheetParserContext = require('./parser/SheetParserContext');

const getNames = (definitions) => definitions.map((d) => d.name);

const updateState = (currentState, newDefinitions) => {
	const definitions = { ...currentState.definitions, ...newDefinitions };
	definitions.all = [...definitions.stream, ...definitions.machine];
	const machineNames = new Set(getNames(definitions.machine));
	const streamNames = new Set(getNames(definitions.stream));
	const names = {
		machine: machineNames,
		stream: streamNames,
		all: new Set([...machineNames, ...streamNames])
	};
	return { names, definitions };
};

class StreamFunctionRegistry {
	constructor() {
		const machineFunctionNames = Object.keys(Functions);
		const machineFunctionDefinitions = Object.keys(Functions).map(
			(name) => ({ name })
		);

		this.state = {
			definitions: {
				machine: machineFunctionDefinitions,
				stream: [],
				all: machineFunctionDefinitions
			},
			names: {
				machine: new Set(machineFunctionNames),
				stream: new Set(),
				all: new Set(machineFunctionNames)
			}
		};
	}

	registerStreamFunctions(functionDefinitions) {
		const streamFunctions = functionDefinitions.reduce(
			(funcObject, funcDefinition) => {
				funcObject[funcDefinition.name] = streamFunc(funcDefinition);
				return funcObject;
			},
			{}
		);
		// TODO: Do this differently
		SheetParser.context = new SheetParserContext(streamFunctions);
		this.state = updateState(this.state, {
			stream: functionDefinitions
		});
	}

	get functionDefinitions() {
		return this.state.definitions.all;
	}

	get streamFunctionNames() {
		return this.state.names.stream;
	}
}

module.exports = new StreamFunctionRegistry();
