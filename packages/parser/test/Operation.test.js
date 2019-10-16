const { Operation } = require('..');

test('isTypeOf', () => {
	expect(Operation.get('+').isTypeOf(Operation.TYPE.BINARY)).toBeTruthy();
	expect(Operation.get('-').isTypeOf(Operation.TYPE.BINARY)).toBeTruthy();
	expect(Operation.get('*').isTypeOf(Operation.TYPE.BINARY)).toBeTruthy();
	expect(Operation.get('/').isTypeOf(Operation.TYPE.BINARY)).toBeTruthy();

	expect(Operation.get('!').isTypeOf(Operation.TYPE.UNARY)).toBeTruthy();

	expect(Operation.get('!=').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();
	expect(Operation.get('=').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();
	expect(Operation.get('==').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();
	expect(Operation.get('>').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();
	expect(Operation.get('>=').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();
	expect(Operation.get('<').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();
	expect(Operation.get('<=').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();
	expect(Operation.get('&').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();
	expect(Operation.get('|').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();

	expect(Operation.get('?').isTypeOf(Operation.TYPE.CONDITION)).toBeTruthy();
});
