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
import { ID } from '../streamsheets';

export type Actor = User;

export interface User {
	id: ID;
	username: string;
	firstName?: string;
	lastName?: string;
	settings?: UserSettings;
	lastModified?: string;
	hadAppTour: boolean;
}

export interface UserSettings {
	locale: string;
}
