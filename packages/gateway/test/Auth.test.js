/* eslint no-unused-vars: 0 */

const Auth = require('../src/Auth');

function btoa(str) {
	if (Buffer.byteLength(str) !== str.length)		{ throw new Error('bad string!'); }
	return Buffer(str, 'binary').toString('base64');
}

describe('Auth.getJwtOptions', () => {
	it('should return defaults', () => {
		const result = Auth.getJwtOptions();
		expect(result.secretOrKey).toBe('superSecret');
		expect(result.jwtFromRequest).toBeDefined();
	});
});

describe('Auth.getToken', () => {
	it('should return token with defined header', () => {
		const result = Auth.getToken({});
		const splittedToken = result.split('.');
		const parsedHeader = JSON.parse(new Buffer(splittedToken[0], 'base64').toString('binary'));
		expect(parsedHeader).toEqual({ alg: 'HS256', typ: 'JWT' });
	});
});

describe('Auth.hashPasswordField', () => {
	it('should replace a plaintext password with hash', () => {
		Auth.hashPasswordField({ password: 'myPassword' })
			.then(updatedObject => expect(updatedObject.password).not.toBe('myPassword'));
	});

	it('should resolve with hash with same length for different passwords', () => {
		Promise.all([
			Auth.hashPasswordField({ password: 'myPassword1' }),
			Auth.hashPasswordField({ password: 'myPassword2' })
		])
		.then((updatedObject) => {
			expect(updatedObject[0].password.length).toBe(updatedObject[1].password.length);
		});
	});
});

describe('Auth.verifyPassword', () => {
	it('should resolve with true if password and hash matches', () => Auth.hashPasswordField({ password: 'myPassword' })
			.then(updatedObject => Auth.verifyPassword(updatedObject.password, 'myPassword'))
			.then(match => expect(match).toBe(true)));

	it('should reject with error if password and hash dont match', () => {
		expect.assertions(1);
		return Auth.hashPasswordField({ password: 'myPassword' })
			.then(updatedObject => Auth.verifyPassword(updatedObject.password, 'myPassword2'))
			.catch(match => expect(match).toEqual({ code: 'PASSWORDS_DONT_MATCH', isSemantic: true }));
	});
});
