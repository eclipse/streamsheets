const { FunctionErrors } = require('@cedalo/error-codes');
const { StreamSheet } = require('@cedalo/machine-core');
const { runFunction } = require('../..').utils;

const ERROR = FunctionErrors.code;

describe('runFunction', () => {
	test('runFunction creation', () => {
		const runner = runFunction();
		expect(runner).toBeDefined();
	});
	it('should support ignoring errors', () => {
		let error;
		const sheet = new StreamSheet().sheet;
		const runner = runFunction(sheet, ['hello', 'world', ERROR.NA, '!!']);
		runner
			.ignoreError()
			.mapNextArg((first) => first)
			.mapNextArg((second) => second)
			.mapNextArg((third) => third)
			.mapNextArg((last) => last)
			.run((first, second, third, last, err) => {
				expect(first).toBe('hello');
				expect(second).toBe('world');
				expect(third).toBe(ERROR.NA);
				expect(last).toBe('!!');
				error = err;
			});
			expect(error).toBeDefined();
			expect(error.error).toBe(ERROR.NA);
			expect(error.index).toBe(2);
	});
});