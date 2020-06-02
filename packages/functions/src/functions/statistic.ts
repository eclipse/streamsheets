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
import { PARAM_TYPES, SheetFunction } from '../function-type';

export const AVERAGE: SheetFunction = {
	name: {
		de: 'AVERAGE',
		en: 'AVERAGE'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'value',
			name: {
				de: 'Wert',
				en: 'value'
			},
			type: {
				name: PARAM_TYPES.ONEOF,
				types: [{ name: PARAM_TYPES.REFERENCE }, { name: PARAM_TYPES.NUMBER }]
			},
			description: {
				de: '',
				en: ''
			}
		}
	],
	repeatParams: ['value']
};

export const COUNT: SheetFunction = {
	name: {
		de: 'COUNT',
		en: 'COUNT'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'value',
			name: {
				de: 'Wert',
				en: 'value'
			},
			type: { name: PARAM_TYPES.ANY },
			description: {
				de: '',
				en: ''
			}
		}
	],
	repeatParams: ['value']
};

export const MAX: SheetFunction = {
	name: {
		de: 'MAX',
		en: 'MAX'
	},
	description: {
		de: 'MAX',
		en: 'MAX'
	},
	parameters: [
		{
			id: 'value',
			name: {
				de: 'Wert',
				en: 'value'
			},
			type: { name: PARAM_TYPES.ANY },
			description: {
				de: '',
				en: ''
			}
		}
	],
	repeatParams: ['value']
};

export const MIN: SheetFunction = {
	name: {
		de: 'MIN',
		en: 'MIN'
	},
	description: {
		de: 'MIN',
		en: 'MIN'
	},
	parameters: [
		{
			id: 'value',
			name: {
				de: 'Wert',
				en: 'value'
			},
			type: { name: PARAM_TYPES.ANY },
			description: {
				de: '',
				en: ''
			}
		}
	],
	repeatParams: ['value']
};
