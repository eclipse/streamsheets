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
const { FuncTerm, CondTerm } = require('..');


describe('TermContext', () => {
	it('should be present in FuncTerm', () => {
		const term = new FuncTerm();
		expect(term.context).toBeDefined();
		expect(term.context.term).toEqual(term);
	});
	it('should be possible to register dispose callback', () => {
		let disposeCalled = false;
		const term = new FuncTerm();
		const callback = () => { disposeCalled = true; };
		term.context.addDisposeListener(callback);
		term.dispose();
		expect(term.isDisposed).toBe(true);
		expect(disposeCalled).toBe(true);
	});
	test('dispose is called in nested terms', () => {
		let condDisposed = false;
		let truthyDisposed = false;
		let falsyDisposed = false;
		const cond = new FuncTerm();
		const truthy = new FuncTerm();
		const falsy = new FuncTerm();
		const term = new CondTerm(cond, truthy, falsy);
		cond.context.addDisposeListener(() => { condDisposed = true; });
		truthy.context.addDisposeListener(() => { truthyDisposed = true; });
		falsy.context.addDisposeListener(() => { falsyDisposed = true; });
		term.dispose();
		expect(condDisposed).toBe(true);
		expect(truthyDisposed).toBe(true);
		expect(falsyDisposed).toBe(true);
	});
});