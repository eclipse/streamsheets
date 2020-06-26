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
import { QueueMessageEncoder } from "azure-storage";

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
	id: keyof T
	name: I18N;
	type: ParamType;
	description: I18N;
}



type Pew<T> = 
	T extends 'NUMBER' ? number :
	T extends 'INT' ? number :
	T extends 'BOOL' ? boolean :
	T extends 'TEXT' ? string :
	T extends 'ENUM' ? string :
	T extends 'JSON' ? object :
	T extends 'REFERENCE' ? object :
	T extends 'ANY' ? any : 
	unknown

const x: Pew<'BOOL'> = true;

type PName = 'NUMBER' |
'INT' |
'TEXT' |
'BOOL' |
'ENUM' |
'JSON' |
'REFERENCE' |
'LIST' |
'ONEOF' |
'ANY' 

// https://github.com/Microsoft/TypeScript/issues/25719

type XX<T extends any[]> =
	T extends [infer U] ? Pew<U> :
	// T extends [infer U, infer ...Array] ? Pew<U> | XX<Q> :
	unknown
	
type Combiner<T extends any[], U = never> = T[number] | U

type nana = Combiner<[string, number]>

type OneOf<T extends Array<PName>> = {
	name: 'ONEOF',
	types: T
}

type ONEOF = {
	name: 'ONEOF',
	types: TYPES
}

type ANY = {
	name: 'ANY'
}

type NUMBER = {
	name: 'NUMBER',
	min?: number,
	max?: number,
}

type BOOL = {
	name: 'BOOL',
	strict?: boolean
}

type Other<T extends PName> = {
	name: T
}

type TYPES = ONEOF | ANY | NUMBER | BOOL



type ParamPew<T> =
	T extends OneOf<infer U> ? Pew<U[number]> :
	T extends Other<infer U> ? Pew<U> :
	T extends PName ? Pew<T>
	: unknown


const y: ParamPew<{name: 'INT'}> = 'test';
const aa: ParamPew<{name: 'ONEOF', types: ['BOOL', 'JSON']}> = 'test';

export interface RequiredSheetParam<T> extends BaseSheetParam<T> {}

export interface OptionalSheetParam<T> extends BaseSheetParam<T> {
	optional: true;
}

export interface DefaultingSheetParam<T> extends BaseSheetParam<T> {
	defaultValue: any;
}

export type SheetParam<T> = RequiredSheetParam<T> | OptionalSheetParam<T> | DefaultingSheetParam<T>;

export type ParamObject<T> = {
	[param in keyof T]: SheetParam<T>
}

// export type ResultObject<T> = {
// 	[P in keyof T]: Pew<T>
// }

export interface SheetFunction<T> {
	id: string
	name: string | I18N;
	description: I18N;
	parameters: Array<SheetParam<T>>;
	repeatParams?: keyof T[];
}
