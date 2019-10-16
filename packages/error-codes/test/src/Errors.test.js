const { Errors, CODES } = require('../../');

describe('Errors.createInternal', () => {
	it('should create error object from know error code', () => {
		const result = Errors.createInternal(CODES.DOMAIN_NOT_FOUND);
		expect(result).toEqual({
			isSemantic: true,
			code: CODES.DOMAIN_NOT_FOUND
		});
	});

	it('should create an error object with UNKNOWN as code if input is unknown', () => {
		const result = Errors.createInternal(`${CODES.DOMAIN_NOT_FOUND}-something`);
		expect(result).toEqual({
			isSemantic: true,
			code: 'UNKNOWN'
		});
	});

	it('should create an error object with UNKNOWN as code if input is missing', () => {
		const result = Errors.createInternal();
		expect(result).toEqual({
			isSemantic: true,
			code: 'UNKNOWN'
		});
	});

	it('should add an message property if supplied', () => {
		const result = Errors.createInternal(CODES.MACHINE_NOT_FOUND, 'message');
		expect(result).toEqual({
			isSemantic: true,
			code: 'MACHINE_NOT_FOUND',
			message: 'message'
		});
	});
});
