import { StringUtil } from '@cedalo/util';

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
			((a[sort.field] || '').toLowerCase() > (b[sort.field] || '').toLowerCase() ? 1 : -1) * directionMultiplier
	);
	return sortedEntities;
};

export const hasFieldError = (errors) =>
	Object.entries(errors).filter(([key, value]) => key !== 'form' && !StringUtil.isEmpty(value)).length > 0;
