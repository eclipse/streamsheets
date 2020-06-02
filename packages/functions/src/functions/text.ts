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

export const CHAR: SheetFunction = {
	name: {
		de: 'CHAR',
		en: 'CHAR'
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
			id: 'codepage',
			name: {
				de: 'Codepage',
				en: 'codepage'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			},
			defaultValue: 'ansi'
		}
	]
};

export const CLEAN: SheetFunction = {
	name: {
		de: 'CLEAN',
		en: 'CLEAN'
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
			id: 'extended',
			name: {
				de: 'Erweitert',
				en: 'extended'
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

export const CODE: SheetFunction = {
	name: {
		de: 'CODE',
		en: 'CODE'
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
			id: 'codepage',
			name: {
				de: 'Codepage',
				en: 'codepage'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			},
			defaultValue: 'ansi'
		}
	]
};

export const CONCAT: SheetFunction = {
	name: {
		de: 'CONCAT',
		en: 'CONCAT'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'value',
			name: {
				de: 'Wert1',
				en: 'value1'
			},
			type: {
				name: PARAM_TYPES.ONEOF,
				types: [{ name: PARAM_TYPES.REFERENCE }, { name: PARAM_TYPES.TEXT }]
			},
			description: {
				de: '',
				en: ''
			}
		}
	],
	repeatParams: ['value']
};

export const FIND: SheetFunction = {
	name: {
		de: 'FIND',
		en: 'FIND'
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
			id: 'searchedText',
			name: {
				de: 'DurchsuchterText',
				en: 'searched_text'
			},
			type: {
				name: PARAM_TYPES.ONEOF,
				types: [{ name: PARAM_TYPES.REFERENCE }, { name: PARAM_TYPES.TEXT }]
			},
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'startFrom',
			name: {
				de: 'StartPosition',
				en: 'start_from'
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

export const LEFT: SheetFunction = {
	name: {
		de: 'LEFT',
		en: 'LEFT'
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
			id: 'numberOfChars',
			name: {
				de: 'AnzahlZeichen',
				en: 'number_of_chars'
			},
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			},
			defaultValue: 1
		}
	]
};

export const LEN: SheetFunction = {
	name: {
		de: 'LEN',
		en: 'LEN'
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

export const MID: SheetFunction = {
	name: {
		de: 'MID',
		en: 'MID'
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
			id: 'startIndex',
			name: {
				de: 'StartPosition',
				en: 'start_index'
			},
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'numberOfChars',
			name: {
				de: 'AnzahlZeichen',
				en: 'number_of_chars'
			},
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const REPLACE: SheetFunction = {
	name: {
		de: 'REPLACE',
		en: 'REPLACE'
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
			id: 'startPosition',
			name: {
				de: 'StartPosition',
				en: 'start_position'
			},
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'numberOfChars',
			name: {
				de: 'AnzahlZeichen',
				en: 'number_of_chars'
			},
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'newText',
			name: {
				de: 'NeuerText',
				en: 'new_text'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const RANDID: SheetFunction = {
	name: {
		de: 'RANDID',
		en: 'RANDID'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'length',
			name: {
				de: 'Länge',
				en: 'length'
			},
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const REPT: SheetFunction = {
	name: {
		de: 'REPT',
		en: 'REPT'
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
			id: 'numberOfRepitions',
			name: {
				de: 'AnzahlWiederholungen',
				en: 'number_of_repetitions'
			},
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const RIGHT: SheetFunction = {
	name: {
		de: 'RIGHT',
		en: 'RIGHT'
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
			id: 'numberOfChars',
			name: {
				de: 'AnzahlZeichen',
				en: 'number_of_chars'
			},
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			},
			defaultValue: 1
		}
	]
};

export const SEARCH: SheetFunction = {
	name: {
		de: 'SEARCH',
		en: 'SEARCH'
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
			id: 'searchedText',
			name: {
				de: 'DurchsuchterText',
				en: 'searched_text'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'startFrom',
			name: {
				de: 'StartPosition',
				en: 'start_from'
			},
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			},
			defaultValue: 1
		}
	]
};

export const SPLIT: SheetFunction = {
	name: {
		de: 'SPLIT',
		en: 'SPLIT'
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
			id: 'separator',
			name: {
				de: 'Trennzeichen',
				en: 'separator'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'index',
			name: {
				de: 'Index',
				en: 'index'
			},
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			},
			defaultValue: 1
		}
	]
};

export const SUBSTITUTE: SheetFunction = {
	name: {
		de: 'REPLACE',
		en: 'REPLACE'
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
			id: 'oldText',
			name: {
				de: 'AlterText',
				en: 'old_text'
			},
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'newText',
			name: {
				de: 'NeuerText',
				en: 'new_text'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'occurences',
			name: {
				de: 'Occurences',
				en: 'occurences'
			},
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			},
			defaultValue: -1
		}
	]
};

export const TEXT: SheetFunction = {
	name: {
		de: 'TEXT',
		en: 'TEXT'
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
			id: 'formatString',
			name: {
				de: 'FormatString',
				en: 'format_string'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'locale',
			name: {
				de: 'Locale',
				en: 'locale'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			},
			optional: true
		}
	]
};

export const UNICHAR: SheetFunction = {
	name: {
		de: 'UNICHAR',
		en: 'UNICHAR'
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
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const UNICODE: SheetFunction = {
	name: {
		de: 'UNICODE',
		en: 'UNICODE'
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

export const VALUE: SheetFunction = {
	name: {
		de: 'UNICODE',
		en: 'UNICODE'
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
			id: 'locale',
			name: {
				de: 'Locale',
				en: 'locale'
			},
			type: { name: PARAM_TYPES.TEXT },
			description: {
				de: '',
				en: ''
			},
			optional: true
		}
	]
};
