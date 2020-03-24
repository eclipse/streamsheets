import { ID, Scope } from '../streamsheets';

export type Actor = User;

export interface User {
	id: ID;
	username: string;
	email: string;
	firstName?: string;
	lastName?: string;
	settings?: UserSettings;
	lastModified?: string;
	scope: Scope;
	role: string;
}

export interface NewUser extends User {
	password: string;
}

export type UserFromRepo = Required<Pick<User, 'settings' | 'lastModified'>> & User;

export interface UserSettings {
	locale: string;
}
