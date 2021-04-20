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

describe('Properties', () => {
	it('should be possible to create a properties object', () => {
		const emptyprops = new Properties();
		expect(emptyprops).toBeDefined();
		expect(emptyprops.attributes).toEqual({});
		expect(emptyprops.formats).toEqual({});
		expect(emptyprops.textFormats).toEqual({});
		const props = new Properties({
			attributes: { initialsection: 42 },
			formats: { fillcolor: 'green' },
			textFormats: { fontcolor: 'blue' }
		});
		expect(props).toBeDefined();
		expect(props.attributes).toEqual({ initialsection: 42 });
		expect(props.formats).toEqual({ fillcolor: 'green' });
		expect(props.textFormats).toEqual({ fontcolor: 'blue' });
	});
	it('return a JSON with set properties', () => {
		const props = new Properties({
			attributes: { initialsection: 42 },
			formats: { fillcolor: 'green' },
			textFormats: { fontcolor: 'blue' }
		});
		expect(props.toJSON()).toEqual({
			attributes: { initialsection: 42 },
			formats: { fillcolor: 'green' },
			textFormats: { fontcolor: 'blue' }
		});
		props.merge({
			attributes: { initialsection: null },
			formats: { fillcolor: null }
		});
		expect(props.toJSON()).toEqual({ textFormats: { fontcolor: 'blue' } });
	});
	it('should be possible to merge properties', () => {
		const props = new Properties();
		props.merge({
			attributes: { initialsection: 42 },
			formats: { fillcolor: 'green' },
			textFormats: { fontcolor: 'blue' }
		});
		expect(props.attributes).toEqual({ initialsection: 42 });
		expect(props.formats).toEqual({ fillcolor: 'green' });
		expect(props.textFormats).toEqual({ fontcolor: 'blue' });
		props.merge({ textFormats: { fontcolor: 'gray' } });
		expect(props.textFormats).toEqual({ fontcolor: 'gray' });
	});
	it('should be possible to clear all properties', () => {
		const props = new Properties({
			attributes: { initialsection: 42 },
			formats: { fillcolor: 'green' },
			textFormats: { fontcolor: 'blue' }
		});
		props.clear();
		expect(props.attributes).toEqual({});
		expect(props.formats).toEqual({});
		expect(props.textFormats).toEqual({});
		expect(props.cleared).toBe(true);
		expect(props.toJSON()).toEqual({ cleared: true });
	});
});
