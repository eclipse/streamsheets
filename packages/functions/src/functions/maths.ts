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

export const ABS: SheetFunction = {
	name: {
		de: 'ABS',
		en: 'ABS'
	},
	description: {
		de: 'Absolute einer Nummer',
		en: 'Absolute of a number'
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
		}
	]
};

export const ARCCOS: SheetFunction = {
	name: {
		de: 'ARCCOS',
		en: 'ARCCOS'
	},
	description: {
		de: 'ARCCOS',
		en: 'ARCCOS'
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
		}
	]
};

export const ARCSIN: SheetFunction = {
	name: {
		de: 'ARCSIN',
		en: 'ARCSIN'
	},
	description: {
		de: 'ARCSIN',
		en: 'ARCSIN'
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
		}
	]
};

export const ARCTAN: SheetFunction = {
	name: {
		de: 'ARCTAN',
		en: 'ARCTAN'
	},
	description: {
		de: 'ARCTAN',
		en: 'ARCTAN'
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
		}
	]
};

export const ARCTAN2: SheetFunction = {
	name: {
		de: 'ARCTAN2',
		en: 'ARCTAN2'
	},
	description: {
		de: 'ARCTAN2',
		en: 'ARCTAN2'
	},
	parameters: [
		{
			id: 'x',
			name: {
				de: 'X',
				en: 'x'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'y',
			name: {
				de: 'Y',
				en: 'y'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const COS: SheetFunction = {
	name: {
		de: 'COS',
		en: 'COS'
	},
	description: {
		de: 'COS',
		en: 'COS'
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
		}
	]
};

export const DEGREES: SheetFunction = {
	name: {
		de: 'DEGREES',
		en: 'DEGREES'
	},
	description: {
		de: 'DEGREES',
		en: 'DEGREES'
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
		}
	]
};

export const EVEN: SheetFunction = {
	name: {
		de: 'EVEN',
		en: 'EVEN'
	},
	description: {
		de: 'EVEN',
		en: 'EVEN'
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
		}
	]
};

export const INT: SheetFunction = {
	name: {
		de: 'INT',
		en: 'INT'
	},
	description: {
		de: 'INT',
		en: 'INT'
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
		}
	]
};

export const MOD: SheetFunction = {
	name: {
		de: 'MOD',
		en: 'MOD'
	},
	description: {
		de: 'MOD',
		en: 'MOD'
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
			id: 'divisor',
			name: {
				de: 'Divisor',
				en: 'divisor'
			},
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const ODD: SheetFunction = {
	name: {
		de: 'ODD',
		en: 'ODD'
	},
	description: {
		de: 'ODD',
		en: 'ODD'
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
		}
	]
};

export const PI: SheetFunction = {
	name: {
		de: 'PI',
		en: 'PI'
	},
	description: {
		de: 'PI',
		en: 'PI'
	},
	parameters: []
};

export const POWER: SheetFunction = {
	name: {
		de: 'POWER',
		en: 'POWER'
	},
	description: {
		de: 'POWER',
		en: 'POWER'
	},
	parameters: [
		{
			id: 'base',
			name: {
				de: 'Basis',
				en: 'base'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'exponent',
			name: {
				de: 'Exponent',
				en: 'exponent'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const RADIANS: SheetFunction = {
	name: {
		de: 'RADIANS',
		en: 'RADIANS'
	},
	description: {
		de: 'RADIANS',
		en: 'RADIANS'
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
		}
	]
};

export const RANDBETWEEN: SheetFunction = {
	name: {
		de: 'RANDBETWEEN',
		en: 'RANDBETWEEN'
	},
	description: {
		de: 'RANDBETWEEN',
		en: 'RANDBETWEEN'
	},
	parameters: [
		{
			id: 'min',
			name: {
				de: 'Min',
				en: 'min'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'max',
			name: {
				de: 'Max',
				en: 'max'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const ROUND: SheetFunction = {
	name: {
		de: 'ROUND',
		en: 'ROUND'
	},
	description: {
		de: 'ROUND',
		en: 'ROUND'
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
			id: 'places',
			name: {
				de: 'Nachkommastellen',
				en: 'places'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const SIGN: SheetFunction = {
	name: {
		de: 'SIGN',
		en: 'SIGN'
	},
	description: {
		de: 'SIGN',
		en: 'SIGN'
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
		}
	]
};

export const SIN: SheetFunction = {
	name: {
		de: 'SIN',
		en: 'SIN'
	},
	description: {
		de: 'SIN',
		en: 'SIN'
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
		}
	]
};
export const SUM: SheetFunction = {
	name: {
		de: 'SUM',
		en: 'SUM'
	},
	description: {
		de: 'SUM',
		en: 'SUM'
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

export const SQRT: SheetFunction = {
	name: {
		de: 'SQRT',
		en: 'SQRT'
	},
	description: {
		de: 'SQRT',
		en: 'SQRT'
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
		}
	]
};

export const TAN: SheetFunction = {
	name: {
		de: 'TAN',
		en: 'TAN'
	},
	description: {
		de: 'TAN',
		en: 'TAN'
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
		}
	]
};

export const TRUNC: SheetFunction = {
	name: {
		de: 'TRUNC',
		en: 'TRUNC'
	},
	description: {
		de: 'Nachkommastellen abschneiden',
		en: 'Truncate a number'
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
			id: 'places',
			name: {
				de: 'Nachkommastellen',
				en: 'places'
			},
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			},
			defaultValue: 0
		}
	]
};
