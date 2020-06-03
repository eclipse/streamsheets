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
import { PartialApply1, MergeParams, PartialApply1All, ParamTypeAt, PartialApply2, PartialApply3 } from "../common";

export function partialApply1<F extends (arg1: any, ...args: any) => any>(
  f: F,
  arg1: Parameters<F>[0]
): PartialApply1<F> {
  return (...args) => f(arg1, ...args);
}

export function partialApply1All<
  T extends {
    [key: string]: (...args: any) => any;
  }
>(object: T, arg1: MergeParams<ParamTypeAt<T, 0>>): PartialApply1All<T> {
  return <PartialApply1All<T>>(
    Object.entries(object).reduce(
      (acc, [key, func]) => ({ ...acc, [key]: partialApply1(func, arg1) }),
      {}
    )
  );
}

export function partialApply2<F extends (arg1: any, arg2: any, ...args: any) => any>(
  f: F,
  arg1: Parameters<F>[0],
  arg2: Parameters<F>[1]
): PartialApply2<F> {
  return (...args) => f(arg1, arg2, ...args);
}

export function partialApply3<
  F extends (arg1: any, arg2: any, arg3: any, ...args: any) => any
>(
  f: F,
  arg1: Parameters<F>[0],
  arg2: Parameters<F>[1],
  arg3: Parameters<F>[2]
): PartialApply3<F> {
  return (...args) => f(arg1, arg2, arg3, ...args);
}
