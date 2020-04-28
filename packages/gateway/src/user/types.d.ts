import { ID } from '../streamsheets';

export type Actor = User;

export interface User {
	id: ID;
	username: string;
	firstName?: string;
	lastName?: string;
	settings?: UserSettings;
	lastModified?: string;
}

export interface UserSettings {
	locale: string;
}
