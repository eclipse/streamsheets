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

export const IFERROR: SheetFunction = {
	name: {
		de: 'IFERROR',
		en: 'IFERROR'
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
		},
		{
			id: 'valueIfError',
			name: {
				de: 'WertBeiFehler',
				en: 'value_if_error'
			},
			type: { name: PARAM_TYPES.ANY },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const ISERR: SheetFunction = {
	name: {
		de: 'ISERR',
		en: 'ISERR'
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
	]
};

export const ISERROR: SheetFunction = {
	name: {
		de: 'ISERROR',
		en: 'ISERROR'
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
	]
};

export const ISEVEN: SheetFunction = {
	name: {
		de: 'ISEVEN',
		en: 'ISEVEN'
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
	]
};

export const ISNA: SheetFunction = {
	name: {
		de: 'ISNA',
		en: 'ISNA'
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
	]
};

export const ISODD: SheetFunction = {
	name: {
		de: 'ISODD',
		en: 'ISODD'
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
	]
};
