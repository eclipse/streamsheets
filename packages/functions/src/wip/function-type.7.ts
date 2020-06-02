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
type ParamArrayResolver<X> = X extends Array<SheetParam<infer T>> ? U<X> : unknown;

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

type XXX<U> = U extends SheetParamObject<infer T, infer P> ? { [K in keyof T]: SheetParamResolver<P> } : never;

const a: XXX<{
	condition: {
		name: {
			de: 'Cnondition';
			en: 'conditio';
		};
		type: { name: 'BOOL' };
		description: {
			de: '';
			en: '';
		};
	};
}>;

function transformParams<
	S extends [SheetParam?, SheetParam?, SheetParam?, SheetParam?, SheetParam?, SheetParam?, SheetParam?, SheetParam?]
>(params: S): SheetParamsResolver<S> {
	return <SheetParamsResolver<S>>params.map(transfromParam);
}

function transfromParam<S extends SheetParam>(p: S): SheetParamResolver<S> {
	return null;
}

const param = {
	name: {
	de: 'Condition',
	en: 'condition'
},
type: { name: PARAM_TYPES.BOOL },
description: {
	de: '',
	en: ''
},
optional: true
ö}

const asdfaa = transfromParam({
	name: {
		de: 'Condition',
		en: 'condition'
	},
	type: { name: PARAM_TYPES.BOOL },
	description: {
		de: '',
		en: ''
	},
	optional: true
});

const pew = transformParams([
	{
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
]);

// type SheetParamResolver<T> = T extends SheetParam ? ParamTypeResolver<T['type']> : never;
type SheetParamResolver<T> = T extends OptionalSheetParam
	? ParamTypeResolver<T['type']> | undefined
	: T extends SheetParam
	? ParamTypeResolver<T['type']>
	: never;

type SheetParamsResolver<T> = { [P in keyof T]: SheetParamResolver<T[P]> };

// type U<T extends any[]> = ParamTypeResolver<T[number]['type']>;

const xxx: ParamArrayResolver<
	[
		{
			id: 'condition';
			name: {
				de: 'Condition';
				en: 'condition';
			};
			type: { name: 'BOOL' };
			description: {
				de: '';
				en: '';
			};
		},
		{
			id: 'trueValue';
			name: {
				de: 'WahrWert';
				en: 'true_value';
			};
			type: { name: 'ANY' };
			description: {
				de: '';
				en: '';
			};
		},
		{
			id: 'falseValue';
			name: {
				de: 'FalschWert';
				en: 'false_vale';
			};
			type: { name: 'ANY' };
			description: {
				de: '';
				en: '';
			};
		}
	]
> = {
	condition: 1,
	falseValue: {},
	trueValue: 'string'
};

const nanana: ParamObjectResolver<{
	condition: { name: 'BOOL' };
	falseValue: { name: 'ANY' };
}> = { condition: false, falseValue: true };

const bsp3: SheetParam = {
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

interface BaseSheetParam {
	name: I18N;
	type: SheetTypes;
	description: I18N;
}

export interface RequiredSheetParam extends BaseSheetParam {}

export interface OptionalSheetParam extends BaseSheetParam {
	optional: true;
}

export interface DefaultingSheetParam extends BaseSheetParam {
	defaultValue: any;
}

export type SheetParam = RequiredSheetParam | OptionalSheetParam | DefaultingSheetParam;

interface SheetParamObject<K, T extends SheetParam> {
	[k: keyof K]: T;
}

const sheetParamResolverTest = function<U, T extends SheetParam<U>>(param: T): [SheetParamResolver<U>, U] {
	return {};
};

const sptest1 = sheetParamResolverTest({
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
});

// interface Nanannu {
// 	[key: string]: ParamTypeObject
// }

export interface SheetFunction<T extends { [key: string]: SheetParam }> {
	id: string;
	name: string | I18N;
	description: I18N;
	parameters: T;
	paramOrder: [];
	repeatParams?: keyof T[];
}

function func2<T>(def: SheetFunction<T>): void {}

func2({
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
});

interface tester {
	condition: boolean;
	trueValue: any;
	falseValue: any;
}
