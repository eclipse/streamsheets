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
export interface FunctionObject {
	[key: string]: (...args: any[]) => any;
}

export type MappedFunctionObjectObject<T extends FunctionObjectObject> = { [K in keyof T]: PartialApply1All<T[K]> };

export type FunctionObjectObject = { [key: string]: FunctionObject };

export type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type ParamTypeAt<
	T extends {
		[key: string]: (...args: any) => any;
	},
	X extends number
> = { [P in keyof T]: Parameters<T[P]>[X] };

export type MergeParams<T extends object> = T extends { [key: string]: infer U } ? U : never;

export type PartialApply1<F extends (arg1: any, ...args: any[]) => any> = (
	...args: Tail<Parameters<F>>
) => ReturnType<F>;

export type PartialApply1All<
	T extends {
		[key: string]: (...args: any) => any;
	}
> = { [P in keyof T]: PartialApply1<T[P]> };

export type PartialApply2<F extends (arg1: any, arg2: any, ...args: any[]) => any> = (
	...args: Tail<Tail<Parameters<F>>>
) => ReturnType<F>;

export type PartialApply2All<
	T extends {
		[key: string]: (...args: any) => any;
	}
> = { [P in keyof T]: PartialApply2<T[P]> };

export type PartialApply3All<
	T extends {
		[key: string]: (...args: any) => any;
	}
> = { [P in keyof T]: PartialApply3<T[P]> };

export type PartialApply3<F extends (arg1: any, arg2: any, arg3: any, ...args: any[]) => any> = (
	...args: Tail<Tail<Tail<Parameters<F>>>>
) => ReturnType<F>;

export type Head<T extends any[]> = T extends [any, ...any[]] ? T[0] : never;
export type Tail<T extends any[]> = ((...t: T) => any) extends (_: any, ...tail: infer TT) => any ? TT : [];
