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
const BooleanConstraint = require('./BooleanConstraint');
const ExpressionConstraint = require('./ExpressionConstraint');
const NumberConstraint = require('./NumberConstraint');
const NumberRangeConstraint = require('./NumberRangeConstraint');
const ObjectConstraint = require('./ObjectConstraint');
const RangeConstraint = require('./RangeConstraint');
const StringConstraint = require('./StringConstraint');

const Registry = {
	'BooleanConstraint': BooleanConstraint,
	'ExpressionConstraint': ExpressionConstraint,
	'NumberConstraint': NumberConstraint,
	'NumberRangeConstraint': NumberRangeConstraint,
	'ObjectConstraint': ObjectConstraint,
	'RangeConstraint': RangeConstraint,
	'StringConstraint': StringConstraint,
	'JSG.graph.expr.BooleanConstraint': BooleanConstraint,
	'JSG.graph.expr.ExpressionConstraint': ExpressionConstraint,
	'JSG.graph.expr.NumberConstraint': NumberConstraint,
	'JSG.graph.expr.NumberRangeConstraint': NumberRangeConstraint,
	'JSG.graph.expr.ObjectConstraint': ObjectConstraint,
	'JSG.graph.expr.RangeConstraint': RangeConstraint,
	'JSG.graph.expr.StringConstraint': StringConstraint,
};


module.exports = {
	get(name) {
		return Registry[name];
	}
};
