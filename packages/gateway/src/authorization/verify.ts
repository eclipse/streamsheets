import { AuthError } from '../errors';
import { RequestContext } from '../streamsheets';
import { User } from '../user';
import { MachineAction } from './machine';
import { Verify } from './types';
import { UserAction } from './user';
import { Machine } from '../machine';

const verify = (allowed: boolean, error: any) => {
	if (!allowed) {
		throw error;
	}
};

export const createVerify = (context: RequestContext): Verify => ({
	verifyUser: (action: UserAction, user: User) =>
		verify(context.auth.userCan(action, user), AuthError.notAllowed(`Not allowed`)),
	verifyMachine: (action: MachineAction, machine: Machine) =>
		verify(context.auth.machineCan(action, machine), AuthError.notAllowed('Not allowed'))
});
