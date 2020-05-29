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
const CellProperties = require('../../src/machine/CellProperties');
const DEF_PROPS = require('../../defproperties.json');

let cellprops;
let sheetprops;

beforeEach(()=> {
	// always start with fresh properties...
	sheetprops = Properties.of({
		attributes: DEF_PROPS.attributes.sheet,
		formats: { styles: DEF_PROPS.formats.styles, text: DEF_PROPS.formats.text }
	});
	cellprops = CellProperties.of({
		attributes: DEF_PROPS.attributes.cell,
		formats: sheetprops.formats
	});
});

describe('CellProperties', () => {
	it('should be possible to create cell properties with default values', () => {
		expect(cellprops).toBeDefined();
		expect(cellprops.attributes).toBeDefined();
		expect(cellprops.formats).toBeDefined();
		expect(cellprops.formats.styles).toBeDefined();
		expect(cellprops.formats.text).toBeDefined();
		// some values:
		expect(cellprops.getAttribute('visible')).toBe(true);
		expect(cellprops.getTextFormat('fontname')).toBe('Verdana');
		expect(cellprops.getStyleFormat('fillcolor')).toBe('#FFFFFF');
	});
	it('should not overwrite default values if attribute or formats are set', () => {
		// set some values:
		cellprops.setAttribute('visible', false);
		cellprops.setTextFormat('fontname', 'Arial');
		cellprops.setStyleFormat('fillcolor', '#00FF00');
		expect(cellprops.getAttribute('visible')).toBe(false);
		expect(cellprops.getTextFormat('fontname')).toBe('Arial');
		expect(cellprops.getStyleFormat('fillcolor')).toBe('#00FF00');
		// delete values
		cellprops.setAttribute('visible', undefined);
		cellprops.setTextFormat('fontname', undefined);
		cellprops.setStyleFormat('fillcolor', undefined);
		// should return defaults again:
		expect(cellprops.getAttribute('visible')).toBe(true);
		expect(cellprops.getTextFormat('fontname')).toBe('Verdana');
		expect(cellprops.getStyleFormat('fillcolor')).toBe('#FFFFFF');
	});
});

describe('CellProperties usage', () => {
	it('should not overwrite values of its base formats', () => {
		// set some values:
		cellprops.setTextFormat('fontname', 'Arial');
		cellprops.setStyleFormat('fillcolor', '#00FF00');
		expect(cellprops.getTextFormat('fontname')).toBe('Arial');
		expect(cellprops.getStyleFormat('fillcolor')).toBe('#00FF00');
		// check that col & row formats are unchanged:
		expect(cellprops.base.getTextFormat('fontname')).toBe('Verdana');
		expect(cellprops.base.getStyleFormat('fillcolor')).toBe('#FFFFFF');
		// delete values
		cellprops.setTextFormat('fontname', undefined);
		cellprops.setStyleFormat('fillcolor', undefined);
		// should return defaults again:
		expect(cellprops.getTextFormat('fontname')).toBe('Verdana');
		expect(cellprops.getStyleFormat('fillcolor')).toBe('#FFFFFF');
	});
	it('should return base format if it has none specified', () => {
		// col format:
		cellprops.base.setTextFormat('fontname', 'Arial');
		cellprops.base.setStyleFormat('fillcolor', '#000000');
		expect(cellprops.getTextFormat('fontname')).toBe('Arial');
		expect(cellprops.getStyleFormat('fillcolor')).toBe('#000000');
		cellprops.base.setTextFormat('fontname', undefined);
		cellprops.base.setStyleFormat('fillcolor', undefined);
		expect(cellprops.getTextFormat('fontname')).toBe('Verdana');
		expect(cellprops.getStyleFormat('fillcolor')).toBe('#FFFFFF');
	});
	it('should only save own defined values', () => {
		expect(cellprops.toJSON()).toEqual({});
		cellprops.setAttribute('visible', false);
		cellprops.setTextFormat('fontname', 'Arial');
		cellprops.setStyleFormat('fillcolor', '#00FF00');
		expect(cellprops.toJSON()).toEqual({ 
			attributes: { visible: false }, 
			formats: { styles: { fillcolor: '#00FF00' }, text: { fontname: 'Arial' } } 
		});
		cellprops.setAttribute('visible', undefined);
		cellprops.setTextFormat('fontname', undefined);
		cellprops.setStyleFormat('fillcolor', undefined);
		expect(cellprops.toJSON()).toEqual({});
	});
	it('should load defined values from JSON object', () => {
		const PROPS_JSON = { 
			attributes: { visible: false }, 
			formats: { styles: { fillcolor: '#00FF00' }, text: { fontname: 'Arial' } } 
		};
		cellprops.initWithJSON(PROPS_JSON);
		expect(cellprops.getAttribute('visible')).toBe(false);
		expect(cellprops.getTextFormat('fontname')).toBe('Arial');
		expect(cellprops.getStyleFormat('fillcolor')).toBe('#00FF00');
	});
});
