import PropTypes from 'prop-types';

export const userShape = PropTypes.shape({
	username: PropTypes.string,
	email: PropTypes.string,
	lastName: PropTypes.string,
	firstName: PropTypes.string,
	lastModified: PropTypes.string,
});
