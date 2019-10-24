const ERROR = require('../errors');
const { termAsType, checkConstraints, asType } = require('./types');
const { messageFromBox, getMachine, isBoxFuncTerm } = require('../utils');
const Message = require('../../machine/Message');

const BASE_FUNC = {
	REQUEST: 'request',
	RESPOND: 'respond',
	PRODUCE: 'produce'
};

const BASE_FUNC_HANDLER = {
	// eslint-disable-next-line
	[BASE_FUNC.REQUEST]: require('../request').requestinternal,
	// eslint-disable-next-line
	[BASE_FUNC.RESPOND]: require('../respond').respondinternal,
	// eslint-disable-next-line
	[BASE_FUNC.PRODUCE]: require('../publishinternal')
};

const check = (result, defaultValue, optional) => {
	const error = ERROR.isError(result);
	if (error) return error;
	if (result !== undefined && result !== null) {
		return result;
	}
	if (defaultValue !== undefined) return defaultValue;
	if (optional) return undefined;
	return ERROR.INVALID_PARAM;
};

const validateValue = (value, config) => {
	const checkedValue = check(value, config.defaultValue, config.optional);
	if (!ERROR.isError(checkedValue) && checkedValue !== undefined && config.type) {
		return checkConstraints(checkedValue, config.type);
	}
	return checkedValue;
};

const toValue = (term, config, sheet) => {
	if (!config.type) {
		return term;
	} else if (isBoxFuncTerm(term)) {
		// TODO check machine is present
		const messageValue = messageFromBox(getMachine(sheet), sheet, term, false);
		if (ERROR.isError(messageValue)) return messageValue;
		return asType(messageValue, config.type);
	}
	return termAsType(term, config.type, sheet);
};

const handleParam = (term, config, sheet) => {
	const value = toValue(term, config, sheet);
	return validateValue(value, config);
};

const handleParameters = (sheet, parameters, args, errorOffset = 0) => {
	const streamJson = {};
	const internalJson = {};
	// eslint-disable-next-line
	for (let [index, paramConfig] of parameters.entries()) {
		const result = handleParam(args[index], paramConfig, sheet);
		if (ERROR.isError(result)) {
			if (result === ERROR.INVALID_PARAM) {
				return `${result}_${index + errorOffset}`;
			}
			if (sheet.isProcessing || result !== ERROR.NO_MSG) {
				return result;
			}
		}
		if (!paramConfig.internal || paramConfig.forward) {
			streamJson[paramConfig.id] = result;
		}
		if (paramConfig.internal) {
			internalJson[paramConfig.id] = result;
		}
	}
	return { internal: internalJson, stream: streamJson };
};

const anyFunc = (functionConfig, func) => (sheet, ...args) => {
	const { parameters } = functionConfig;
	const paramJson = handleParameters(sheet, parameters, args);
	if (ERROR.isError(paramJson) ||
		(typeof paramJson === 'string' && paramJson.startsWith(ERROR.INVALID_PARAM))) {
		return paramJson;
	}
	return func(sheet, paramJson);
};

const streamFunc = functionConfig => function f(sheet, stream, ...args) {
	const { baseFunction, parameters, name } = functionConfig;
	const paramsCopy = [].concat(parameters);
	const func = BASE_FUNC_HANDLER[baseFunction];
	const callArguments = [sheet, stream];

	const transformedParams = handleParameters(sheet, paramsCopy, args, 2);
	if (ERROR.isError(transformedParams) ||
		(typeof transformedParams === 'string' && transformedParams.startsWith(ERROR.INVALID_PARAM))) {
		return transformedParams;
	}

	transformedParams.stream.functionName = name;

	// Ugly, fix me
	if (baseFunction === BASE_FUNC.REQUEST) {
		transformedParams.stream = new Message(transformedParams.stream);
		callArguments.unshift(f.term);
	}

	callArguments.push(transformedParams.stream, transformedParams.internal);

	return func(...callArguments);
};


module.exports = { streamFunc, anyFunc, BASE_FUNC };
