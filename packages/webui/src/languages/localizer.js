/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
import { FunctionErrors } from '@cedalo/error-codes';
import store from '../store';

export const localizeError = (error) => {
	const { locale } = store.getState().locales;
	return FunctionErrors.localizeError(error, locale);
};
