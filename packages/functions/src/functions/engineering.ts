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

export const BIN2DEC: SheetFunction = {
	name: {
		de: 'BIN2DEC',
		en: 'BIN2DEC'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'text',
			name: {
				de: 'Text',
				en: 'text'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const BIN2HEX: SheetFunction = {
	name: {
		de: 'BIN2HEX',
		en: 'BIN2HEX'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'text',
			name: {
				de: 'Text',
				en: 'text'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'padding',
			name: {
				de: 'Padding',
				en: 'padding'
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

export const BIN2OCT: SheetFunction = {
	name: {
		de: 'BIN2OCT',
		en: 'BIN2OCT'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'text',
			name: {
				de: 'Text',
				en: 'text'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'padding',
			name: {
				de: 'Padding',
				en: 'padding'
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

export const HEX2BIN: SheetFunction = {
	name: {
		de: 'HEX2BIN',
		en: 'HEX2BIN'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'text',
			name: {
				de: 'Text',
				en: 'text'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'padding',
			name: {
				de: 'Padding',
				en: 'padding'
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

export const HEX2DEC: SheetFunction = {
	name: {
		de: 'HEX2DEC',
		en: 'HEX2DEC'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'text',
			name: {
				de: 'Text',
				en: 'text'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const HEX2OCT: SheetFunction = {
	name: {
		de: 'HEX2OCT',
		en: 'HEX2OCT'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'text',
			name: {
				de: 'Text',
				en: 'text'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'padding',
			name: {
				de: 'Padding',
				en: 'padding'
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

export const DEC2BIN: SheetFunction = {
	name: {
		de: 'DEC2BIN',
		en: 'DEC2BIN'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'number',
			name: {
				de: 'Number',
				en: 'number'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'padding',
			name: {
				de: 'Padding',
				en: 'padding'
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

export const DEC2HEX: SheetFunction = {
	name: {
		de: 'DEC2HEX',
		en: 'DEC2HEX'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'number',
			name: {
				de: 'Number',
				en: 'number'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'padding',
			name: {
				de: 'Padding',
				en: 'padding'
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

export const DEC2OCT: SheetFunction = {
	name: {
		de: 'DEC2OCT',
		en: 'DEC2OCT'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'number',
			name: {
				de: 'Number',
				en: 'number'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'padding',
			name: {
				de: 'Padding',
				en: 'padding'
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

export const OCT2BIN: SheetFunction = {
	name: {
		de: 'OCT2BIN',
		en: 'OCT2BIN'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'text',
			name: {
				de: 'Text',
				en: 'text'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'padding',
			name: {
				de: 'Padding',
				en: 'padding'
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

export const OCT2DEC: SheetFunction = {
	name: {
		de: 'OCT2DEC',
		en: 'OCT2DEC'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'text',
			name: {
				de: 'Text',
				en: 'text'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const OCT2HEX: SheetFunction = {
	name: {
		de: 'OCT2HEX',
		en: 'OCT2HEX'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'text',
			name: {
				de: 'Text',
				en: 'text'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'padding',
			name: {
				de: 'Padding',
				en: 'padding'
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
