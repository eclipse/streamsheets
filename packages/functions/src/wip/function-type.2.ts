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

interface BaseSheetParam<T> {
	id: keyof T;
	name: I18N;
	type: ParamType;
	description: I18N;
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

const x: Pew<'BOOL'> = true;

type PName = 'NUMBER' | 'INT' | 'TEXT' | 'BOOL' | 'ENUM' | 'JSON' | 'REFERENCE' | 'LIST' | 'ONEOF' | 'ANY';

// https://github.com/Microsoft/TypeScript/issues/25719

type XX<T extends any[]> = T extends [infer U]
	? Pew<U> // T extends [infer U, infer ...Array] ? Pew<U> | XX<Q> :
	: unknown;

type U<T extends any[], U = never> = T[number] | U;

type OneOf<T extends Array<PName>> = {
	name: 'ONEOF';
	types: T;
};

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

type Other<T extends PName> = {
	name: T;
};

type MostBasicParam<T extends BASIC_TYPES> = T extends INT | NUMBER
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

type BasicParam<T extends BASIC_TYPES> = T extends LIST<infer U> ? Array<MostBasicParam<U>> : MostBasicParam<T>;

// type Nana = T extends

// interface Nana<T extends BASIC_TYPES> extends BasicParam<T> {}

type BASIC_TYPES = ANY | NUMBER | INT | BOOL | JSON | TEXT | ILIST;

interface ILIST extends LIST<BASIC_TYPES> {}

type TYPES = ONEOF<Array<BASIC_TYPES>> | BASIC_TYPES;

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

type ParamPew<T extends TYPES> = T extends ONEOF<infer U>
	? BasicParam<U[number]>
	: T extends BASIC_TYPES
	? BasicParam<T>
	: never;

const y: ParamPew<{ name: 'BOOL' }> = true;
const aa: ParamPew<{ name: 'ONEOF'; types: [{ name: 'BOOL' }, { name: 'JSON' }] }> = { a: 1 };
const list: ParamPew<{ name: 'LIST'; type: { name: 'ONEOF', types: [{ name: 'BOOL' }, { name: 'JSON' }] } }> = 0;

export interface RequiredSheetParam<T> extends BaseSheetParam<T> {}

export interface OptionalSheetParam<T> extends BaseSheetParam<T> {
	optional: true;
}

export interface DefaultingSheetParam<T> extends BaseSheetParam<T> {
	defaultValue: any;
}

export type SheetParam<T> = RequiredSheetParam<T> | OptionalSheetParam<T> | DefaultingSheetParam<T>;

export type ParamObject<T> = { [P in keyof T]: SheetParam<T> };

// export type ResultObject<T> = {
// 	[P in keyof T]: Pew<T>
// }

export interface SheetFunction<T> {
	id: string;
	name: string | I18N;
	description: I18N;
	parameters: Array<SheetParam<T>>;
	repeatParams?: keyof T[];
}
