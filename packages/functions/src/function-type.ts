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
export const PARAM_TYPES = {
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

type OneOf<T extends Array<CombinedSheetTypes>> = {
	name: 'ONEOF';
	types: T;
};

type List<T extends CombinedSheetTypes> = {
	name: 'LIST';
	type: T;
};

type Any = {
	name: 'ANY';
};

type Number = {
	name: 'NUMBER';
	min?: number;
	max?: number;
};

type Int = {
	name: 'INT';
	min?: number;
	max?: number;
};

type Text = {
	name: 'TEXT';
};

type Json = {
	name: 'JSON';
};

type Bool = {
	name: 'BOOL';
	strict?: boolean;
};

type Reference = {
	name: 'REFERENCE';
};

type NonRecursiveTypes = Any | Number | Int | Bool | Json | Text | Reference;

type SheetTypes = NonRecursiveTypes | List<SheetTypes2> | Json | OneOf<Array<Exclude<SheetTypes2, OneOf<any[]>>>>;
type SheetTypes2 = NonRecursiveTypes | List<SheetTypes3> | Json | OneOf<Array<Exclude<SheetTypes3, OneOf<any[]>>>>;
type SheetTypes3 = NonRecursiveTypes | List<SheetTypes4> | Json | OneOf<Array<Exclude<SheetTypes4, OneOf<any[]>>>>;
type SheetTypes4 = NonRecursiveTypes | List<SheetTypes5> | Json | OneOf<Array<Exclude<SheetTypes5, OneOf<any[]>>>>;
type SheetTypes5 = NonRecursiveTypes | List<Any> | Json;

type CombinedSheetTypes = SheetTypes | SheetTypes2 | SheetTypes3 | SheetTypes4 | SheetTypes5;

export interface I18N {
	de: string;
	en: string;
}

interface BaseSheetParam {
	id: string;
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

export interface SheetFunction {
	name: I18N;
	description: I18N;
	parameters: Array<SheetParam>;
	repeatParams?: Array<string>;
}

