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

export const AND: SheetFunction = {
	name: {
		de: 'AND',
		en: 'AND'
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
				types: [{ name: PARAM_TYPES.REFERENCE }, { name: PARAM_TYPES.BOOL }]
			},
			description: {
				de: '',
				en: ''
			}
		}
	],
	repeatParams: ['value']
};

export const IF: SheetFunction = {
	name: {
		de: 'IF',
		en: 'IF'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'condition',
			name: {
				de: 'Condition',
				en: 'condition'
			},
			type: { name: PARAM_TYPES.BOOL },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'trueValue',
			name: {
				de: 'WahrWert',
				en: 'true_value'
			},
			type: { name: PARAM_TYPES.ANY },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'falseValue',
			name: {
				de: 'FalschWert',
				en: 'false_vale'
			},
			type: { name: PARAM_TYPES.ANY },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const NOT: SheetFunction = {
	name: {
		de: 'NOT',
		en: 'NOT'
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
			type: { name: PARAM_TYPES.BOOL },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const OR: SheetFunction = {
	name: {
		de: 'OR',
		en: 'OR'
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
				types: [{ name: PARAM_TYPES.REFERENCE }, { name: PARAM_TYPES.BOOL }]
			},
			description: {
				de: '',
				en: ''
			}
		}
	],
	repeatParams: ['value']
};

export const SWTICH = {
	name: {
		de: 'SWTICH',
		en: 'SWTICH'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'testValue',
			name: {
				de: 'Wert',
				en: 'value'
			},
			type: { name: PARAM_TYPES.ANY },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'case',
			name: {
				de: 'Wert',
				en: 'case'
			},
			type: { name: PARAM_TYPES.ANY },
			description: {
				de: '',
				en: ''
			}
		},
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
		},
		{
			id: 'defaultValue',
			name: {
				de: 'Default Wert',
				en: 'default_value'
			},
			type: { name: PARAM_TYPES.ANY },
			description: {
				de: '',
				en: ''
			},
			optional: true
		}
	],
	repeatParams: ['case', 'value']
};
