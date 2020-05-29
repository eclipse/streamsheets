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
const ObjectFactory = require('../../../ObjectFactory');
const { readObject, writeJSON } = require ('./json');

const restoreExpression = (exprData, item) => {
	const obj = ObjectFactory.create(exprData.type);
	const expr = readObject('expr', exprData.json, obj);
	expr.evaluate(item);
	expr.correctFormula(item);
	return expr;
};

const writeExpression = (expr, cb) => ({
	type: expr.constructor.name,
	json: writeJSON('expr', expr, 15, cb)
});

module.exports = {
	restoreExpression,
	writeExpression
};
