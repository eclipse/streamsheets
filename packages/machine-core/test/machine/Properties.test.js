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
const Properties = require('../../src/machine/Properties');
const DEF_PROPS = require('../../defproperties.json');


describe('Properties', () => {
	it('should be possible to create properties with default values', () => {
		const props = Properties.of({
			attributes: DEF_PROPS.attributes.sheet,
			formats: { styles: DEF_PROPS.formats.styles, text: DEF_PROPS.formats.text }
		});
		expect(props).toBeDefined();
		expect(props.attributes).toBeDefined();
		expect(props.formats).toBeDefined();
		expect(props.formats.styles).toBeDefined();
		expect(props.formats.text).toBeDefined();
		// some values:
		expect(props.getAttribute('defaultsectionsize')).toBe(2000);
		expect(props.getTextFormat('fontname')).toBe('Verdana');
		expect(props.getStyleFormat('fillcolor')).toBe('#FFFFFF');
	});
	it('should not overwrite default values if attributer or formats are set', () => {
		const props = Properties.of({
			attributes: DEF_PROPS.attributes.sheet,
			formats: { styles: DEF_PROPS.formats.styles, text: DEF_PROPS.formats.text }
		});
		// set some values:
		props.setAttribute('defaultsectionsize', 100);
		props.setTextFormat('fontname', 'Arial');
		props.setStyleFormat('fillcolor', '#00FF00');
		expect(props.getAttribute('defaultsectionsize')).toBe(100);
		expect(props.getTextFormat('fontname')).toBe('Arial');
		expect(props.getStyleFormat('fillcolor')).toBe('#00FF00');
		// delete values
		props.setAttribute('defaultsectionsize', undefined);
		props.setTextFormat('fontname', undefined);
		props.setStyleFormat('fillcolor', undefined);
		// should return defaults again:
		expect(props.getAttribute('defaultsectionsize')).toBe(2000);
		expect(props.getTextFormat('fontname')).toBe('Verdana');
		expect(props.getStyleFormat('fillcolor')).toBe('#FFFFFF');
	});
});

describe('Properties usage', () => {
	it('should be possible to create an hierarchy of properties', () => {
		const sheetprops = Properties.of({
			attributes: DEF_PROPS.attributes.sheet,
			formats: { styles: DEF_PROPS.formats.styles, text: DEF_PROPS.formats.text }
		});
		const rowprops = Properties.of(sheetprops);
		// expect that kid-props inherit values of parent-props
		expect(rowprops.getAttribute('defaultsectionsize')).toBe(2000);
		expect(rowprops.getTextFormat('fontname')).toBe('Verdana');
		expect(rowprops.getStyleFormat('fillcolor')).toBe('#FFFFFF');
		// changing values of parent should reflect in kid-props
		sheetprops.setAttribute('defaultsectionsize', 100);
		sheetprops.setTextFormat('fontname', 'Arial');
		sheetprops.setStyleFormat('fillcolor', '#00FF00');
		expect(rowprops.getAttribute('defaultsectionsize')).toBe(100);
		expect(rowprops.getTextFormat('fontname')).toBe('Arial');
		expect(rowprops.getStyleFormat('fillcolor')).toBe('#00FF00');
		// deleting values set should get defaults again:
		sheetprops.setAttribute('defaultsectionsize', undefined);
		sheetprops.setTextFormat('fontname', undefined);
		sheetprops.setStyleFormat('fillcolor', undefined);
		// should return defaults again:
		expect(rowprops.getAttribute('defaultsectionsize')).toBe(2000);
		expect(rowprops.getTextFormat('fontname')).toBe('Verdana');
		expect(rowprops.getStyleFormat('fillcolor')).toBe('#FFFFFF');
	});
	it('should be possible to overwrite values in child properties without overwriting parent values', () => {
		const sheetprops = Properties.of({
			attributes: DEF_PROPS.attributes.sheet,
			formats: { styles: DEF_PROPS.formats.styles, text: DEF_PROPS.formats.text }
		});
		const rowprops = Properties.of(sheetprops);
		rowprops.setAttribute('defaultsectionsize', 100);
		rowprops.setTextFormat('fontname', 'Arial');
		rowprops.setStyleFormat('fillcolor', '#00FF00');
		expect(rowprops.getAttribute('defaultsectionsize')).toBe(100);
		expect(rowprops.getTextFormat('fontname')).toBe('Arial');
		expect(rowprops.getStyleFormat('fillcolor')).toBe('#00FF00');
		// change a value of parent should not affect kid:
		sheetprops.setTextFormat('fontname', 'Tahoma');
		sheetprops.setStyleFormat('fillcolor', '#000000');
		expect(sheetprops.getTextFormat('fontname')).toBe('Tahoma');
		expect(sheetprops.getStyleFormat('fillcolor')).toBe('#000000');
		expect(rowprops.getTextFormat('fontname')).toBe('Arial');
		expect(rowprops.getStyleFormat('fillcolor')).toBe('#00FF00');
		// remove child props should give parent props again:
		rowprops.setAttribute('defaultsectionsize', undefined);
		rowprops.setTextFormat('fontname', undefined);
		rowprops.setStyleFormat('fillcolor', undefined);
		expect(rowprops.getAttribute('defaultsectionsize')).toBe(2000);
		expect(rowprops.getTextFormat('fontname')).toBe('Tahoma');
		expect(rowprops.getStyleFormat('fillcolor')).toBe('#000000');
	});
	it.skip('should be possible to remove all properties of child properties', () => {
		const sheetprops = Properties.of({
			attributes: DEF_PROPS.attributes.sheet,
			formats: { styles: DEF_PROPS.formats.styles, text: DEF_PROPS.formats.text }
		});
		// change some properties:
		const rowprops = Properties.of(sheetprops);
		rowprops.setAttribute('level', 5);
		rowprops.setStyleFormat('fillcolor', '#00FF00');
		rowprops.setStyleFormat('gradientcolor', '#00FF00');
		rowprops.setTextFormat('fontcolor', '#0000FF');
		rowprops.setTextFormat('fontstyle', 2);
		expect(rowprops.getAttribute('level')).toBe(5);
		expect(rowprops.getStyleFormat('fillcolor')).toBe('#00FF00');
		expect(rowprops.getStyleFormat('gradientcolor')).toBe('#00FF00');
		expect(rowprops.getTextFormat('fontcolor')).toBe('#0000FF');
		expect(rowprops.getTextFormat('fontstyle')).toBe(2);

		// simply reset all applied formats by passing an undefined or empty object...
		rowprops.setFormats();
		// should have default formats again:
		expect(rowprops.getAttribute('level')).toBe(5);
		expect(rowprops.getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(rowprops.getStyleFormat('gradientcolor')).toBe(DEF_PROPS.formats.styles.gradientcolor);
		expect(rowprops.getTextFormat('fontcolor')).toBe(DEF_PROPS.formats.text.fontcolor);
		expect(rowprops.getTextFormat('fontstyle')).toBe(DEF_PROPS.formats.text.fontstyle);
		// simply reset all applied attributes by passing an undefined or empty object...
		rowprops.setAttributes();
		expect(rowprops.getAttribute('level')).toBe(DEF_PROPS.attributes.level);

		// once again to reset all in one go:
		rowprops.setAttribute('level', 5);
		rowprops.setStyleFormat('fillcolor', '#00FF00');
		rowprops.setStyleFormat('gradientcolor', '#00FF00');
		rowprops.setTextFormat('fontcolor', '#0000FF');
		rowprops.setTextFormat('fontstyle', 2);
		expect(rowprops.getAttribute('level')).toBe(5);
		expect(rowprops.getStyleFormat('fillcolor')).toBe('#00FF00');
		expect(rowprops.getStyleFormat('gradientcolor')).toBe('#00FF00');
		expect(rowprops.getTextFormat('fontcolor')).toBe('#0000FF');
		expect(rowprops.getTextFormat('fontstyle')).toBe(2);

		// simply reset all properties by passing an undefined or empty object...
		rowprops.setProperties();
		expect(rowprops.getAttribute('level')).toBe(DEF_PROPS.attributes.level);
		expect(rowprops.getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(rowprops.getStyleFormat('gradientcolor')).toBe(DEF_PROPS.formats.styles.gradientcolor);
		expect(rowprops.getTextFormat('fontcolor')).toBe(DEF_PROPS.formats.text.fontcolor);
		expect(rowprops.getTextFormat('fontstyle')).toBe(DEF_PROPS.formats.text.fontstyle);
	});
	it('should save only own defined values', () => {
		const sheetprops = Properties.of({
			attributes: DEF_PROPS.attributes.sheet,
			formats: { styles: DEF_PROPS.formats.styles, text: DEF_PROPS.formats.text }
		});
		const rowprops = Properties.of(sheetprops);
		expect(rowprops.toJSON()).toEqual({});
		rowprops.setAttribute('defaultsectionsize', 100);
		rowprops.setTextFormat('fontname', 'Arial');
		rowprops.setStyleFormat('fillcolor', '#00FF00');
		expect(rowprops.toJSON()).toEqual({ 
			attributes: { defaultsectionsize: 100 }, 
			formats: { styles: { fillcolor: '#00FF00' }, text: { fontname: 'Arial' } } 
		});
		rowprops.setAttribute('defaultsectionsize', undefined);
		rowprops.setTextFormat('fontname', undefined);
		rowprops.setStyleFormat('fillcolor', undefined);
		expect(rowprops.toJSON()).toEqual({});
	});
	it('should load defined values from JSON object', () => {
		const sheetprops = Properties.of({
			attributes: DEF_PROPS.attributes.sheet,
			formats: { styles: DEF_PROPS.formats.styles, text: DEF_PROPS.formats.text }
		});
		const rowprops = Properties.of(sheetprops);
		const PROPS_JSON = { 
			attributes: { defaultsectionsize: 100 }, 
			formats: { styles: { fillcolor: '#00FF00' }, text: { fontname: 'Arial' } } 
		};
		rowprops.initWithJSON(PROPS_JSON);
		expect(rowprops.getAttribute('defaultsectionsize')).toBe(100);
		expect(rowprops.getTextFormat('fontname')).toBe('Arial');
		expect(rowprops.getStyleFormat('fillcolor')).toBe('#00FF00');
	});
});
