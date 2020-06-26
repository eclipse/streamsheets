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

export const CHOOSE: SheetFunction = {
	name: {
		de: 'CHOOSE',
		en: 'CHOOSE'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'number',
			name: {
				de: 'Nummer',
				en: 'number'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'value',
			name: {
				de: 'value',
				en: 'value'
			},
			type: { name: PARAM_TYPES.ANY },
			description: {
				de: '',
				en: ''
			},
			defaultValue: 'ansi'
		}
	],
	repeatParams: ['value']
};

export const COLUMN: SheetFunction = {
	name: {
		de: 'COLUMN',
		en: 'COLUMN'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'reference',
			name: {
				de: 'reference',
				en: 'reference'
			},
			type: { name: PARAM_TYPES.REFERENCE },
			description: {
				de: '',
				en: ''
			},
			optional: true
		}
	]
};

export const INDEX: SheetFunction = {
	name: {
		de: 'INDEX',
		en: 'INDEX'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'range',
			name: {
				de: 'range',
				en: 'range'
			},
			type: { name: PARAM_TYPES.REFERENCE },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'rowOffset',
			name: {
				de: 'rowOffset',
				en: 'rowOffset'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'colOffset',
			name: {
				de: 'colOffset',
				en: 'colOffset'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'areanr',
			name: {
				de: 'areanr',
				en: 'areanr'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			},
			defaultValue: 0
		}
	]
};

export const MATCH: SheetFunction = {
	name: {
		de: 'MATCH',
		en: 'MATCH'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'value',
			name: {
				de: 'value',
				en: 'value'
			},
			type: { name: PARAM_TYPES.ANY },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'range',
			name: {
				de: 'range',
				en: 'range'
			},
			type: { name: PARAM_TYPES.REFERENCE },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'type',
			name: {
				de: 'type',
				en: 'type'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			},
			defaultValue: 1
		}
	]
};

export const OFFSET: SheetFunction = {
	name: {
		de: 'OFFSET',
		en: 'OFFSET'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'range',
			name: {
				de: 'range',
				en: 'range'
			},
			type: { name: PARAM_TYPES.REFERENCE },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'row',
			name: {
				de: 'row',
				en: 'row'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'col',
			name: {
				de: 'col',
				en: 'col'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			},
			defaultValue: 1
		},
		{
			id: 'height',
			name: {
				de: 'height',
				en: 'height'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			},
			defaultValue: -1
		},
		{
			id: 'width',
			name: {
				de: 'width',
				en: 'width'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			},
			defaultValue: -1
		}
	]
};

export const ROW: SheetFunction = {
	name: {
		de: 'ROW',
		en: 'ROW'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'reference',
			name: {
				de: 'reference',
				en: 'reference'
			},
			type: { name: PARAM_TYPES.REFERENCE },
			description: {	
				de: '',
				en: ''
			},
			optional: true
		}
	]
};

export const VLOOKUP: SheetFunction = {
	name: {
		de: 'VLOOKUP',
		en: 'VLOOKUP'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'value',
			name: {
				de: 'value',
				en: 'value'
			},
			type: { name: PARAM_TYPES.ANY },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'range',
			name: {
				de: 'range',
				en: 'range'
			},
			type: { name: PARAM_TYPES.REFERENCE },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'index',
			name: {
				de: 'index',
				en: 'index'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'exact',
			name: {
				de: 'exact',
				en: 'exact'
			},
			type: { name: PARAM_TYPES.BOOL },
			description: {
				de: '',
				en: ''
			},
			defaultValue: true
		}
	]
};
