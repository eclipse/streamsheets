const { wildcards } = require('../../src/utils');

describe('wildcards', () => {
	it('should replace all * characters by .*', () => {
		expect(wildcards.toRegStr('*hello')).toBe('^.*hello$');
		expect(wildcards.toRegStr('hello*world')).toBe('^hello.*world$');
		expect(wildcards.toRegStr('world*')).toBe('^world.*$');
		expect(wildcards.toRegStr('*hello*world*')).toBe('^.*hello.*world.*$');
	});
	it('should replace all ? characters by .{1}', () => {
		expect(wildcards.toRegStr('?hello')).toBe('^.{1}hello$');
		expect(wildcards.toRegStr('hello?world')).toBe('^hello.{1}world$');
		expect(wildcards.toRegStr('world?')).toBe('^world.{1}$');
		expect(wildcards.toRegStr('?hello?world?')).toBe('^.{1}hello.{1}world.{1}$');
	});
	it('should replace all ~* by \\* ', () => {
		expect(wildcards.toRegStr('~*hello')).toBe('^\\*hello$');
		expect(wildcards.toRegStr('hello~*world')).toBe('^hello\\*world$');
		expect(wildcards.toRegStr('world~*')).toBe('^world\\*$');
		expect(wildcards.toRegStr('~*hello~*world~*')).toBe('^\\*hello\\*world\\*$');
	});
	it('should replace all ~? by \\? ', () => {
		expect(wildcards.toRegStr('~?hello')).toBe('^\\?hello$');
		expect(wildcards.toRegStr('hello~?world')).toBe('^hello\\?world$');
		expect(wildcards.toRegStr('world~?')).toBe('^world\\?$');
		expect(wildcards.toRegStr('~?hello~?world~?')).toBe('^\\?hello\\?world\\?$');
	});
	it('should replace all ~~ by ~ ', () => {
		expect(wildcards.toRegStr('~~hello')).toBe('^~hello$');
		expect(wildcards.toRegStr('hello~~world')).toBe('^hello~world$');
		expect(wildcards.toRegStr('world~~')).toBe('^world~$');
		expect(wildcards.toRegStr('~~hello~~world~~')).toBe('^~hello~world~$');
	});
	it('should escape special reg ex characters but not * or ?', () => {
		expect(wildcards.toRegStr('he[llo')).toBe('^he\\[llo$');
		expect(wildcards.toRegStr('^mr.str|ng+er)$')).toBe('^\\^mr\\.str\\|ng\\+er\\)\\$$');
		expect(wildcards.toRegStr('he*llo?')).toBe('^he.*llo.{1}$');
		expect(wildcards.toRegStr('h[ll^o$w.r|l?d*!+1(2)')).toBe('^h\\[ll\\^o\\$w\\.r\\|l.{1}d.*!\\+1\\(2\\)$');
		expect(wildcards.toRegStr('[ \\ ^ $ . | ? * + ( )')).toBe('^\\[ \\\\ \\^ \\$ \\. \\| .{1} .* \\+ \\( \\)$');
	});
	it('should create a regular expression to use for testing strings', () => {
		const regex1 = wildcards.toRegExp('h?llo');
		expect(regex1.test('hello')).toBeTruthy();
		expect(regex1.test('hallo')).toBeTruthy();
		expect(regex1.test('hallo12')).toBeFalsy();
		expect(regex1.test('heello2')).toBeFalsy();
		const regex2 = wildcards.toRegExp('*llo');
		expect(regex2.test('llo')).toBeTruthy();
		expect(regex2.test('hello')).toBeTruthy();
		expect(regex2.test('hallo')).toBeTruthy();
		expect(regex2.test('hallo2')).toBeFalsy();
	});
});
