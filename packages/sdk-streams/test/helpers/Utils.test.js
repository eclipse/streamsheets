const Utils = require('../../src/helpers/Utils');

describe('Stream API#Utils', () => {
	it('should parse an array', () => {
		const testArray = JSON.stringify([["asdfasd", "sdfsdf"], ["sdf", "sdfds"]]);
		expect.assertions(1);
		const parsed =  Utils.parseJson(testArray);
		expect(Array.isArray(parsed)).toBeTruthy();
	});

	it('should transform a Buffer/text to json object and back', () => {
		const text = Buffer.from('Happy');
		const jsonObject = Utils.transformToJSONObject(text, {
			mimeType: 'text/plain'
		});
		expect(typeof jsonObject === 'object');
		expect(jsonObject.text === 'Happy');
		const text_ = Utils.transformFromJSONObject(jsonObject, {
			mimeType: 'text/plain'
		});
		expect(text_ === text);
		expect(text_.length === text.length);
	});

	it('should transform a Buffer to json object based on contentType', () => {
		const hexInput = '73747265616d736865657473';
		const utf8Out = 'streamsheets';
		const buff = Buffer.from(utf8Out);
		const jsonObjectHex = Utils.transformToJSONObject(buff, {
			mimeType: 'text/plain',
			contentEncoding: 'hex'
		});
		expect(typeof jsonObjectHex === 'object');
		expect(jsonObjectHex.value === hexInput);
		const jsonObjectUtf8 = Utils.transformToJSONObject(buff, {
			mimeType: 'text/plain',
		});
		expect(typeof jsonObjectHex === 'object');
		expect(jsonObjectUtf8.value === hexInput);
	});

	it('should transform a json to json object and back', () => {
		const json = JSON.stringify({
			text: 'Happy',
			num: 3
		});
		const jsonObject = Utils.transformToJSONObject(
			json,{
				mimeType: 'application/json'
			}
		);
		expect(typeof jsonObject === 'object');
		expect(jsonObject.text === 'Happy');
		expect(jsonObject.num === 3);
		const json_ = Utils.transformFromJSONObject(
			jsonObject,
			'application/json'
		);
		expect(json_ === json);
		expect(json_.length === json.length);
	});
	it('should transform an xml to json object and back', () => {
		const xml =
			'<?xml version="1.0" encoding="utf-8"?>' +
			'<note importance="high" logged="true">' +
			'    <title>Happy</title>' +
			'    <num>3</num>' +
			'    <todo>Work</todo>' +
			'    <todo>Play</todo>' +
			'</note>';
		const jsonObject = Utils.transformToJSONObject(xml, {
			mimeType: 'application/xml'
		});
		expect(typeof jsonObject === 'object');
		expect(jsonObject.note.title._text === 'Happy');
		expect(jsonObject.note.num._text === 3);
		const xml_ = Utils.transformFromJSONObject(
			jsonObject,
			'application/xml'
		);
		expect(xml_ === xml);
		expect(xml_.length === xml.length);
	});
	it('should transform an xml when in auto mode', () => {
		const xml =
			'<?xml version="1.0" encoding="utf-8"?>' +
			'<note importance="high" logged="true">' +
			'    <title>Happy</title>' +
			'    <num>3</num>' +
			'    <todo>Work</todo>' +
			'    <todo>Play</todo>' +
			'</note>';
		const jsonObject = Utils.transformToJSONObject(xml, {
			mimeType: 'auto'
		});
		expect(typeof jsonObject === 'object');
		expect(jsonObject.note.title._text === 'Happy');
		expect(jsonObject.note.num._text === 3);
		const xml_ = Utils.transformFromJSONObject(
			jsonObject,
			'application/xml'
		);
		expect(xml_ === xml);
		expect(xml_.length === xml.length);
	});
});
