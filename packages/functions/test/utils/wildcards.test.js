const { wildcards } = require('../../src/utils');

describe('wildcards', () => {
	it('should replace all * characters by .*', () => {
		expect(wildcards.toRegExStr('*hello')).toBe('.*hello');
		expect(wildcards.toRegExStr('hello*world')).toBe('hello.*world');
		expect(wildcards.toRegExStr('world*')).toBe('world.*');
		expect(wildcards.toRegExStr('*hello*world*')).toBe('.*hello.*world.*');
	});
	it('should replace all ? characters by .{1}', () => {
		expect(wildcards.toRegExStr('?hello')).toBe('.{1}hello');
		expect(wildcards.toRegExStr('hello?world')).toBe('hello.{1}world');
		expect(wildcards.toRegExStr('world?')).toBe('world.{1}');
		expect(wildcards.toRegExStr('?hello?world?')).toBe('.{1}hello.{1}world.{1}');
	});
	it('should replace all ~* by \\* ', () => {
		expect(wildcards.toRegExStr('~*hello')).toBe('\\*hello');
		expect(wildcards.toRegExStr('hello~*world')).toBe('hello\\*world');
		expect(wildcards.toRegExStr('world~*')).toBe('world\\*');
		expect(wildcards.toRegExStr('~*hello~*world~*')).toBe('\\*hello\\*world\\*');
	});
	it('should replace all ~? by \\? ', () => {
		expect(wildcards.toRegExStr('~?hello')).toBe('\\?hello');
		expect(wildcards.toRegExStr('hello~?world')).toBe('hello\\?world');
		expect(wildcards.toRegExStr('world~?')).toBe('world\\?');
		expect(wildcards.toRegExStr('~?hello~?world~?')).toBe('\\?hello\\?world\\?');
	});
	it('should replace all ~~ by ~ ', () => {
		expect(wildcards.toRegExStr('~~hello')).toBe('~hello');
		expect(wildcards.toRegExStr('hello~~world')).toBe('hello~world');
		expect(wildcards.toRegExStr('world~~')).toBe('world~');
		expect(wildcards.toRegExStr('~~hello~~world~~')).toBe('~hello~world~');
	});
	it('should escape special reg ex characters but not * or ?', () => {
		expect(wildcards.toRegExStr('he[llo')).toBe('he\\[llo');
		expect(wildcards.toRegExStr('^mr.str|ng+er)$')).toBe('\\^mr\\.str\\|ng\\+er\\)\\$');
		expect(wildcards.toRegExStr('he*llo?')).toBe('he.*llo.{1}');
		expect(wildcards.toRegExStr('h[ll^o$w.r|l?d*!+1(2)')).toBe('h\\[ll\\^o\\$w\\.r\\|l.{1}d.*!\\+1\\(2\\)');
		expect(wildcards.toRegExStr('[ \\ ^ $ . | ? * + ( )')).toBe('\\[ \\\\ \\^ \\$ \\. \\| .{1} .* \\+ \\( \\)');
	});
	it('should create a regular expression to use for testing strings', () => {
		const regex1 = wildcards.toBoundedRegExp('h?llo');
		expect(regex1.test('hello')).toBeTruthy();
		expect(regex1.test('hallo')).toBeTruthy();
		expect(regex1.test('hallo12')).toBeFalsy();
		expect(regex1.test('heello2')).toBeFalsy();
		const regex2 = wildcards.toBoundedRegExp('*llo');
		expect(regex2.test('llo')).toBeTruthy();
		expect(regex2.test('hello')).toBeTruthy();
		expect(regex2.test('hallo')).toBeTruthy();
		expect(regex2.test('hallo2')).toBeFalsy();
	});
});
