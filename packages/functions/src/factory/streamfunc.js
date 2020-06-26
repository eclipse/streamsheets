/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const { termAsType, checkConstraints, asType } = require('../utils/types');
const { messageFromBox, getMachine } = require('../utils/sheet');
const { isBoxFuncTerm } = require('../utils/terms');
const {	FunctionErrors } = require('@cedalo/error-codes');
const { Message } = require('@cedalo/machine-core');


const BASE_FUNC = {
	REQUEST: 'request',
	RESPOND: 'respond',
	PRODUCE: 'produce'
};

const BASE_FUNC_HANDLER = {
	// eslint-disable-next-line
	[BASE_FUNC.REQUEST]: require('../functions/streamsheet/request').requestinternal,
	// eslint-disable-next-line
	[BASE_FUNC.RESPOND]: require('../functions/streamsheet/respond').respondinternal,
	// eslint-disable-next-line
	[BASE_FUNC.PRODUCE]: require('../utils/publishinternal')
};

const check = (result, defaultValue, optional) => {
	const error = FunctionErrors.isError(result);
	if (error) return error;
	if (result !== undefined && result !== null) {
		return result;
	}
	if (defaultValue !== undefined) return defaultValue;
	if (optional) return undefined;
	return FunctionErrors.code.INVALID_PARAM;
};

const validateValue = (value, config) => {
	const checkedValue = check(value, config.defaultValue, config.optional);
	if (!FunctionErrors.isError(checkedValue) && checkedValue !== undefined && config.type) {
		return checkConstraints(checkedValue, config.type);
	}
	return checkedValue;
};

const toValue = (term, config, sheet) => {
	if (!config.type) {
		return term;
	}
	if (isBoxFuncTerm(term)) {
		// TODO check machine is present
		const messageValue = messageFromBox(getMachine(sheet), sheet, term, false);
		if (FunctionErrors.isError(messageValue)) return messageValue;
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
		if (FunctionErrors.isError(result)) {
			if (result === FunctionErrors.code.INVALID_PARAM) {
				return `${result}_${index + errorOffset}`;
			}
			if (sheet.isProcessing || result !== FunctionErrors.code.NO_MSG) {
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

// const anyFunc = (functionConfig, func) => (sheet, ...args) => {
// 	const { parameters } = functionConfig;
// 	const paramJson = handleParameters(sheet, parameters, args);
// 	if (FunctionErrors.isError(paramJson) ||
// 		(typeof paramJson === 'string' && paramJson.startsWith(FunctionErrors.code.INVALID_PARAM))) {
// 		return paramJson;
// 	}
// 	return func(sheet, paramJson);
// };
const hasError = (val) =>
	FunctionErrors.isError(val) || (typeof val === 'string' && val.startsWith(FunctionErrors.code.INVALID_PARAM));


const streamFunc = functionConfig => {
	function f(sheet, stream, ...args) {
		const { baseFunction, parameters, name } = functionConfig;
		const paramsCopy = [].concat(parameters);
		const func = BASE_FUNC_HANDLER[baseFunction];
		const callArguments = [sheet, stream];

		const transformedParams = handleParameters(sheet, paramsCopy, args, 2);
		if (hasError(transformedParams)) {
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
	}
	f.displayName = functionConfig.displayName;
	return f;
};


module.exports = streamFunc;
