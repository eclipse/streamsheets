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

export const DATE: SheetFunction = {
	name: {
		de: 'DATE',
		en: 'DATE'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'year',
			name: {
				de: 'Jahr',
				en: 'year'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'month',
			name: {
				de: 'Monat',
				en: 'month'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'day',
			name: {
				de: 'Tag',
				en: 'day'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const DATEVALUE: SheetFunction = {
	name: {
		de: 'DATEVALUE',
		en: 'DATEVALUE'
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

export const DAY: SheetFunction = {
	name: {
		de: 'DAY',
		en: 'DAY'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'date',
			name: {
				de: 'Date',
				en: 'date'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const EXCEL2JSONTIME: SheetFunction = {
	name: {
		de: 'EXCEL2JSONTIME',
		en: 'EXCEL2JSONTIME'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'date',
			name: {
				de: 'Date',
				en: 'date'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const HOUR: SheetFunction = {
	name: {
		de: 'HOUR',
		en: 'HOUR'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'date',
			name: {
				de: 'Date',
				en: 'date'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const JSON2EXCELTIME: SheetFunction = {
	name: {
		de: 'HOUR',
		en: 'HOUR'
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

export const MINUTE: SheetFunction = {
	name: {
		de: 'MINUTE',
		en: 'MINUTE'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'date',
			name: {
				de: 'Date',
				en: 'date'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const MONTH: SheetFunction = {
	name: {
		de: 'MONTH',
		en: 'MONTH'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'date',
			name: {
				de: 'Date',
				en: 'date'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const MSTOSERIAL: SheetFunction = {
	name: {
		de: 'MSTOSERIAL',
		en: 'MSTOSERIAL'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'timeValue',
			name: {
				de: 'TimeValue',
				en: 'TimeValue'
			},
			type: { name: PARAM_TYPES.INT },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const NOW: SheetFunction = {
	name: {
		de: 'NOW',
		en: 'NOW'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: []
};

export const SECOND: SheetFunction = {
	name: {
		de: 'SECOND',
		en: 'SECOND'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'date',
			name: {
				de: 'Date',
				en: 'date'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const SERIALTOMS: SheetFunction = {
	name: {
		de: 'SERIALTOMS',
		en: 'SERIALTOMS'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'date',
			name: {
				de: 'Date',
				en: 'date'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const TIME: SheetFunction = {
	name: {
		de: 'TIME',
		en: 'TIME'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'hour',
			name: {
				de: 'Stunde',
				en: 'hour'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'minute',
			name: {
				de: 'Minute',
				en: 'minute'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		},
		{
			id: 'second',
			name: {
				de: 'Sekunde',
				en: 'second'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const TIMEVALUE: SheetFunction = {
	name: {
		de: 'TIMEVALUE',
		en: 'TIMEVALUE'
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

export const WEEKDAY: SheetFunction = {
	name: {
		de: 'WEEKDAY',
		en: 'WEEKDAY'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'date',
			name: {
				de: 'Date',
				en: 'date'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const YEAR: SheetFunction = {
	name: {
		de: 'YEAR',
		en: 'YEAR'
	},
	description: {
		de: '',
		en: ''
	},
	parameters: [
		{
			id: 'date',
			name: {
				de: 'Date',
				en: 'date'
			},
			type: { name: PARAM_TYPES.NUMBER },
			description: {
				de: '',
				en: ''
			}
		}
	]
};
