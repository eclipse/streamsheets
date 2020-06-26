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
import { PARAM_TYPES, SheetFunction, RequiredSheetParam } from '../function-type';

export const STACKADD: SheetFunction = {
	name: {
		de: 'STACKADD',
		en: 'STACKADD'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'stackRange',
			name: {
				de: 'stackRange',
				en: 'stackRange'
			},
			type: { name: PARAM_TYPES.REFERENCE },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'sourceRange',
			name: {
				de: 'sourceRange',
				en: 'source_range'
			},
			type: { name: PARAM_TYPES.REFERENCE },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'atBottom',
			name: {
				de: 'atBottom',
				en: 'atBottom'
			},
			type: { name: PARAM_TYPES.BOOL },
			description: {
				de: '',
				en: ''
			},
			defaultValue: true
		},
		{
			id: 'targetRange',
			name: {
				de: 'targetRange',
				en: 'targetRange'
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

export const STACKDROP: SheetFunction = {
	name: {
		de: 'STACKDROP',
		en: 'STACKDROP'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'stackRange',
			name: {
				de: 'stackRange',
				en: 'stackRange'
			},
			type: { name: PARAM_TYPES.REFERENCE },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'position',
			name: {
				de: 'position',
				en: 'position'
			},
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			},
			defaultValue: 1
		},
		{
			id: 'targetRange',
			name: {
				de: 'targetRange',
				en: 'targetRange'
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

export const STACKFIND: SheetFunction = {
	name: {
		de: 'STACKFIND',
		en: 'STACKFIND'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'stackRange',
			name: {
				de: 'stackRange',
				en: 'stackRange'
			},
			type: { name: PARAM_TYPES.REFERENCE },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'criteriaRange',
			name: {
				de: 'criteriaRange',
				en: 'criteriaRange'
			},
			type: { name: PARAM_TYPES.REFERENCE },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'targetRange',
			name: {
				de: 'targetRange',
				en: 'targetRange'
			},
			type: { name: PARAM_TYPES.REFERENCE },
			description: {
				de: '',
				en: ''
			},
			optional: true
		},
		{
			id: 'dropRows',
			name: {
				de: 'dropRows',
				en: 'dropRows'
			},
			type: { name: PARAM_TYPES.BOOL },
			description: {
				de: '',
				en: ''
			},
			defaultValue: false
		}
	]
};

export const STACKROTATE: SheetFunction = {
	name: {
		de: 'STACKROTATE',
		en: 'STACKROTATE'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'stackRange',
			name: {
				de: 'stackRange',
				en: 'stackRange'
			},
			type: { name: PARAM_TYPES.REFERENCE },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'position',
			name: {
				de: 'position',
				en: 'position'
			},
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			},
			defaultValue: 1
		},
		{
			id: 'targetRange',
			name: {
				de: 'targetRange',
				en: 'targetRange'
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

export const STACKSORT: SheetFunction = {
	name: {
		de: 'STACKSORT',
		en: 'STACKSORT'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'stackRange',
			name: {
				de: 'stackRange',
				en: 'stackRange'
			},
			type: { name: PARAM_TYPES.REFERENCE },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'sortrange',
			name: {
				de: 'sortrange',
				en: 'sortrange'
			},
			type: { name: PARAM_TYPES.REFERENCE },
			description: {
				de: '',
				en: ''
			}
		}
	]
};
