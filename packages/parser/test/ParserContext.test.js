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
const ParserContext = require('../src/ParserContext');

describe('ParserContext', () => {
	it('should be possible to register functions to context', () => {
		const context = new ParserContext();
		// register some functions
		context.setFunction('SuM', (scope, ...params) => {
			let sum = 0;
			for (let i = 0, n = params.length; i < n; i += 1) {
				const param = params[i];
				sum += param.operand != null ? param.value : param;
			}
			return sum;
		});
		context.setFunction('pi', () => Math.PI);
		context.setFunction('SCOPE_ID', (scope, ...params) => {
			const id = params.length > 0 ? params[0] : -1;
			return (this && this.getId) ? this.getId() === id : false;
		});
		context.setFunction('MAX', (scope, ...params) => {
			let max = Number.MIN_VALUE;
			let value;
			for (let i = 0, n = params.length; i < n; i += 1) {
				value = params[i];
				max = value > max ? value : max;
			}
			return max;
		});
		expect(context.hasFunction('max')).toBeTruthy();
		expect(context.hasFunction('sum')).toBeTruthy();
		expect(context.hasFunction('nee')).toBeFalsy();
		expect(context.getFunction('max')).toBeDefined();
		expect(context.getFunction('suM')).toBeDefined();
		expect(context.getFunction('tach')).toBeUndefined();
	});
});