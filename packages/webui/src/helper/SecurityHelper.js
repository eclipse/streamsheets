const DEF_USER = {
	userId: 'New User',
	className: 'User',
	active: true,
	lastLogin: null,
	firstName: '',
	secondName: '',
	mail: '',
	avatar: 'images/avatar.png',
	settings: {
		locale: 'en',
		debug: false,
		displayMachines: 'grid',
		displayStreams: 'list',
		showNotifications: 'popup',
		homePage: '/dashboard',
		formatSettings: {
			numberFormat: '',
			fontSize: '',
			fontColor: '',
			backgroundColor: '',
		},
	},
};

export default class SecurityHelper {
	static createNewUser() {
		return Object.assign({}, DEF_USER, {name: DEF_USER.name});
	}
}
