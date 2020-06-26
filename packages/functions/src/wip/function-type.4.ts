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
import { QueueMessageEncoder } from 'azure-storage';
import { never } from 'rxjs/observable/never';

export const PARAM_TYPES: ParamTypeNames = {
	NUMBER: 'NUMBER',
	INT: 'INT',
	TEXT: 'TEXT',
	BOOL: 'BOOL',
	ENUM: 'ENUM',
	JSON: 'JSON',
	REFERENCE: 'REFERENCE',
	LIST: 'LIST',
	ONEOF: 'ONEOF',
	ANY: 'ANY'
} as const;

export interface ParamTypeNames {
	NUMBER: 'NUMBER';
	INT: 'INT';
	TEXT: 'TEXT';
	BOOL: 'BOOL';
	ENUM: 'ENUM';
	JSON: 'JSON';
	REFERENCE: 'REFERENCE';
	LIST: 'LIST';
	ONEOF: 'ONEOF';
	ANY: 'ANY';
}

export interface ParamTypeObject {
	name: keyof ParamTypeNames;
	[key: string]: any;
}

export type ParamType = keyof ParamTypeNames | ParamTypeObject;

export interface I18N {
	de: string;
	en: string;
}

type Pew<T> = T extends 'NUMBER'
	? number
	: T extends 'INT'
	? number
	: T extends 'BOOL'
	? boolean
	: T extends 'TEXT'
	? string
	: T extends 'ENUM'
	? string
	: T extends 'JSON'
	? object
	: T extends 'REFERENCE'
	? object
	: T extends 'ANY'
	? any
	: unknown;

type PName = 'NUMBER' | 'INT' | 'TEXT' | 'BOOL' | 'ENUM' | 'JSON' | 'REFERENCE' | 'LIST' | 'ONEOF' | 'ANY';

type ONEOF<T extends Array<BASIC_TYPES>> = {
	name: 'ONEOF';
	types: T;
};

type LIST<T extends BASIC_TYPES> = {
	name: 'LIST';
	type: T;
};

type ANY = {
	name: 'ANY';
};

type NUMBER = {
	name: 'NUMBER';
	min?: number;
	max?: number;
};

type INT = {
	name: 'INT';
	min?: number;
	max?: number;
};

type TEXT = {
	name: 'TEXT';
};

type JSON = {
	name: 'JSON';
};

type BOOL = {
	name: 'BOOL';
	strict?: boolean;
};

type NonRecursiveTypes<T extends BASIC_TYPES> = T extends INT | NUMBER
	? number
	: T extends BOOL
	? boolean
	: T extends TEXT
	? string
	: T extends JSON
	? object
	: T extends ANY
	? any
	: unknown;

type BasicTypes1<T extends BASIC_TYPES> = T extends LIST<infer U>
	? Array<BasicTypes2<U>>
	: T extends ONEOF<infer U>
	? BasicTypes2<U[number]>
	: NonRecursiveTypes<T>;

type BasicTypes2<T extends BASIC_TYPES> = T extends LIST<infer U>
	? Array<BasicTypes3<U>>
	: T extends ONEOF<infer U>
	? BasicTypes3<U[number]>
	: NonRecursiveTypes<T>;

type BasicTypes3<T extends BASIC_TYPES> = T extends LIST<infer U>
	? Array<BasicTypes4<U>>
	: T extends ONEOF<infer U>
	? BasicTypes4<U[number]>
	: NonRecursiveTypes<T>;
type BasicTypes4<T extends BASIC_TYPES> = T extends LIST<infer U>
	? Array<BasicTypes5<U>>
	: T extends ONEOF<infer U>
	? BasicTypes5<U[number]>
	: NonRecursiveTypes<T>;
type BasicTypes5<T extends BASIC_TYPES> = T extends LIST<any>
	? Array<any>
	: T extends ONEOF<infer U>
	? NonRecursiveTypes<U[number]>
	: NonRecursiveTypes<T>;

type NON_RECURSIVE_TYPES = ANY | NUMBER | INT | BOOL | JSON | TEXT;

type BASIC_TYPES1 = NON_RECURSIVE_TYPES | LIST<BASIC_TYPES2> | JSON | ONEOF<Array<Exclude<BASIC_TYPES2, ONEOF<any[]>>>>;
type BASIC_TYPES2 = NON_RECURSIVE_TYPES | LIST<BASIC_TYPES3> | JSON | ONEOF<Array<Exclude<BASIC_TYPES3, ONEOF<any[]>>>>;
type BASIC_TYPES3 = NON_RECURSIVE_TYPES | LIST<BASIC_TYPES4> | JSON | ONEOF<Array<Exclude<BASIC_TYPES4, ONEOF<any[]>>>>;
type BASIC_TYPES4 = NON_RECURSIVE_TYPES | LIST<BASIC_TYPES5> | JSON | ONEOF<Array<Exclude<BASIC_TYPES5, ONEOF<any[]>>>>;
type BASIC_TYPES5 = NON_RECURSIVE_TYPES | LIST<ANY> | JSON;

type BASIC_TYPES = BASIC_TYPES1 | BASIC_TYPES2 | BASIC_TYPES3 | BASIC_TYPES4 | BASIC_TYPES5;

type SheetTypes = BASIC_TYPES;

type ParamTypeResolver<T> = T extends SheetTypes ? BasicTypes1<T> : never;

// type ParamObjectResolver<T extends SheetParam<any> = ParamTypeResolver<T['type']>;

type ParamObjectResolver<T> = { [P in keyof T]: ParamTypeResolver<T[P]> };
type ParamArrayResolver<X> =  X extends Array<SheetParam<infer T, infer K>> ? U<X> : unknown

const y: ParamTypeResolver<{ name: 'BOOL' }> = true;
const aa: ParamTypeResolver<{ name: 'ONEOF'; types: [{ name: 'BOOL' }, { name: 'JSON' }] }> = { a: 1 };
const list1: ParamTypeResolver<{
	name: 'LIST';
	type: { name: 'ONEOF'; types: [{ name: 'BOOL' }, { name: 'JSON' }, { name: 'LIST'; type: { name: 'NUMBER' } }] };
}> = [true, { a: 1 }, [1, 2, 3, 4]];

const list2: ParamTypeResolver<{
	name: 'LIST';
	type: { name: 'LIST'; type: { name: 'LIST'; type: { name: 'BOOL' } } };
}> = [[[false]]];

// type InferedKeyIn<T extends { [key: string]: BASIC_TYPES }> = {
// 	[P in keyof T]: ParamObjectResolver<T, SheetParam<T>>
// };

type U<T extends any[], U = never> = ParamTypeResolver<T[number]["type"]> | U

const xxx: ParamArrayResolver<[
	{
		id: 'condition',
		name: {
			de: 'Condition',
			en: 'condition'
		},
		type: { name: 'BOOL' },
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
		type: { name: 'ANY' },
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
		type: { name: 'ANY' },
		description: {
			de: '',
			en: ''
		}
	}
]> = {
	condition: 1,
	falseValue: {},
	trueValue: "string"
}

const nanana: ParamObjectResolver<{
	condition: { name: 'BOOL' };
	falseValue: { name: 'ANY' };
}> = { condition: false, falseValue: true };

const pot = <T, K extends keyof T>(x: SheetFunction<T, K>): ParamObjectResolver<T> => {
	return {}
}

const x = pot({
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
})

interface BaseSheetParam<T, K extends keyof T> {
	id: K;
	name: I18N;
	type: T[K];
	description: I18N;
}

const bsp: BaseSheetParam<
	{
		condition: { name: 'BOOL' };
		trueValue: { name: 'NUMBER' };
	},
	"condition"
> = {
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
};

const bsp3: SheetParam<
	{
		condition: { name: 'BOOL' };
		trueValue: { name: 'NUMBER' };
	},
	'condition'
> = {
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
};

export interface RequiredSheetParam<T, K extends keyof T>
	extends BaseSheetParam<T, K> {}

export interface OptionalSheetParam<T, K extends keyof T>
	extends BaseSheetParam<T, K> {
	optional: true;
}

export interface DefaultingSheetParam<T, K extends keyof T>
	extends BaseSheetParam<T, K> {
	defaultValue: any;
}

export type SheetParam<T, K extends keyof T> =
	| RequiredSheetParam<T, K>
	| OptionalSheetParam<T, K>
	| DefaultingSheetParam<T, K>;

// interface Nanannu {
// 	[key: string]: ParamTypeObject
// }

export interface SheetFunction<T, K extends keyof T> {
	id: string;
	name: string | I18N;
	description: I18N;
	parameters: Array<SheetParam<T, K>>;
	repeatParams?: keyof T[];
}

function func2<T, K extends keyof T>(
	def: SheetFunction<T, K>,
	x: ParamObjectResolver<T, K>,
	func: (params: ParamObjectResolver<T, K>) => any
): void {}

func2(
	{
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
	},
	{
		falseValue: "string",
		trueValue: {},
		condition: {},
	},
	(obj) => {
		obj.falseValue;
		obj.trueValue;
		obj.condition;
		obj.nein;
	}
);

interface tester {
	condition: boolean;
	trueValue: any;
	falseValue: any;
}
