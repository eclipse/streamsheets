import { Scope } from '../streamsheets';
import { User } from '../user';
import { MachineAction } from './machine';
import { UserAction } from './user';
import { StreamAction } from './stream';
import { Stream } from '../stream';
import { Machine } from '../machine';

export interface Authorization extends Verify {
	isAdmin(user: User): boolean;
	isSelf(user: User): boolean;
	isValidScope(scope: Scope): boolean;
	isInScope(scope: Scope, entity: { scope?: Scope }): boolean;
	userCan(action: UserAction, user: User): boolean;
	rights(user?: User): string[];
	roles(): string[];
	machineCan(action: MachineAction, machine: Machine): boolean;
	streamCan(action: StreamAction, stream: Stream): boolean;
}

export interface Verify {
	verifyUser(action: UserAction, user: User): void;
	verifyMachine(action: MachineAction, machine: Machine): void;
}
