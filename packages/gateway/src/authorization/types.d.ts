import { Machine, Scope } from '../streamsheets';
import { User } from '../user';
import { MachineAction } from './machine';
import { UserAction } from './user';

export interface Authorization extends Verify {
	isAdmin(user: User): boolean;
	isSelf(user: User): boolean;
	isValidScope(scope?: Scope): boolean;
	userCan(action: UserAction, user: User): boolean;
	machineCan(action: MachineAction, machine: Machine): boolean;
}

export interface Verify {
	verifyUser(action: UserAction, user: User): void;
	verifyMachine(action: MachineAction, machine: Machine): void;
}
