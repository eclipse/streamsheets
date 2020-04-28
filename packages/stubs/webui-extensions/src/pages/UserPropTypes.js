import PropTypes from 'prop-types';

export const userShape = PropTypes.shape({
	username: PropTypes.string,
	lastModified: PropTypes.string,
});
