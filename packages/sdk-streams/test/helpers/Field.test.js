const Field = require('../../src/configurations/Field');

describe('Stream API#Field', () => {
	it('should get valid field value from field type text and value null', () => {
		const field = new Field({
			type: Field.TYPES.TEXT,
			value: null
		});
		expect(field.value).toEqual('');
	});
	it('should get valid field value from field type undefined and value null', () => {
		const field = new Field({
			value: null
		});
		expect(field.value).toEqual('');
	});
	it('should get valid field value from field type INT and value null', () => {
		const field = new Field({
			value: null,
			type: Field.TYPES.INT
		});
		expect(field.value).toEqual(0);
	});
	it('should get valid field value from field type TEXTLIST and value null', () => {
		const field = new Field({
			value: null,
			type: Field.TYPES.TEXTLIST
		});
		expect(field.value).toEqual([]);
	});
});
