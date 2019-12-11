const { AuthError } = require('../errors');

const isAdmin = (user) => user.id === '00000000000000';
const isSelf = (actor, user) => actor.id === user.id;
const canDelete = (actor, user) => !isAdmin(user) && (isAdmin(actor) || isSelf(actor, user));
const canUpdate = (actor, user) => isAdmin(actor) || isSelf(actor, user);
const canCreate = isAdmin;
const canView = (actor, user) => isAdmin(actor) || isSelf(actor, user);

const verifyUpdate = (actor, user) => {
	if (!canUpdate(actor, user)) {
		throw AuthError.notAllowed('No permission to update user');
	}
};
const verifyDelete = (actor, user) => {
	if (!canDelete(actor, user)) {
		throw AuthError.notAllowed('No permission to delete user');
	}
};
const verifyCreate = (actor, user) => {
	if (!canCreate(actor, user)) {
		throw AuthError.notAllowed('No permission to create user');
	}
};
const verifyView = (actor, user) => {
	if (!canView(actor, user)) {
		throw AuthError.notAllowed('No permission to view user');
	}
};

module.exports = {
	isAdmin,
	canDelete,
	canUpdate,
	canCreate,
	canView,
	verifyUpdate,
	verifyDelete,
	verifyCreate,
	verifyView
};
