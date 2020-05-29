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
import { StringUtil } from '@cedalo/util';

const lowerCaseIfString = (s) => (typeof s === 'string' ? s.toLowerCase() : s);

export const filterAndSort = (fields = []) => (entities = [], filterText, sort) => {
	const shownEntities =
		filterText && fields.length > 0
			? entities.filter((entity) =>
					Object.entries(entity)
						.filter(([key]) => fields.includes(key))
						.map(([, value]) => value)
						.join('\n')
						.toLowerCase()
						.match(filterText.toLowerCase())
			  )
			: entities;
	const directionMultiplier = sort.direction === 'asc' ? 1 : -1;
	const sortedEntities = shownEntities.sort(
		(a, b) =>
			(lowerCaseIfString(a[sort.field] || '') > lowerCaseIfString(b[sort.field] || '') ? 1 : -1) *
			directionMultiplier
	);
	return sortedEntities;
};

export const hasFieldError = (errors) =>
	Object.entries(errors).filter(([key, value]) => key !== 'form' && !StringUtil.isEmpty(value)).length > 0;
