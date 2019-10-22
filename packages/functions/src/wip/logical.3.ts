import { PARAM_TYPES, SheetFunction, ParamObject, SheetParam } from '../function-type.3';

function func<T>(
	name: string,
	description,
	parameters: Array<SheetParam<T>>,
	repeatParams?: Array<keyof T>
): SheetFunction<T> {
	return {
		name,
		parameters,
		repeatParams: repeatParams || [],
		description
	};
}

function func2<T>(def: SheetFunction<T>): SheetFunction<T> {
	return def;
}

export const IF = func2({
	id: 'IF',
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
			type: PARAM_TYPES.BOOL,
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
			type: PARAM_TYPES.ANY,
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
			type: PARAM_TYPES.ANY,
			description: {
				de: '',
				en: ''
			}
		}
	]
});

export const NOT: SheetFunction = {
	id: 'NOT',
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
			name: {
				de: 'Wert',
				en: 'value'
			},
			type: PARAM_TYPES.BOOL,
			description: {
				de: '',
				en: ''
			}
		}
	]
};

export const OR: SheetFunction = {
	id: 'OR',
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
			name: {
				de: 'Wert1',
				en: 'value1'
			},
			type: {
				name: PARAM_TYPES.ONEOF,
				types: [PARAM_TYPES.RANGE, PARAM_TYPES.BOOL]
			},
			description: {
				de: '',
				en: ''
			}
		}
	],
	restParam: {
		name: {
			de: 'Wert2',
			en: 'value2'
		},
		type: {
			name: PARAM_TYPES.ONEOF,
			types: [PARAM_TYPES.RANGE, PARAM_TYPES.BOOL]
		},
		description: {
			de: '',
			en: ''
		}
	}
};

export const SWTICH: SheetFunction = {
	id: 'SWTICH',
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
			name: {
				de: 'Wert',
				en: 'value'
			},
			type: PARAM_TYPES.ANY,
			description: {
				de: '',
				en: ''
			}
		}
	],
	restParam: {
		name: {
			de: 'Key-Value',
			en: 'value2'
		},
		type: {
			name: PARAM_TYPES.ONEOF,
			types: [PARAM_TYPES.RANGE, PARAM_TYPES.BOOL]
		},
		description: {
			de: '',
			en: ''
		}
	},
	trailingParam: {
		name: {
			de: 'Wert2',
			en: 'value2'
		},
		type: {
			name: PARAM_TYPES.ONEOF,
			types: [PARAM_TYPES.RANGE, PARAM_TYPES.BOOL]
		},
		description: {
			de: '',
			en: ''
		}
	}
};
