/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
import JSG from '@cedalo/jsg-ui';


const {
	CommandStack: JSGCommandStack,
	Notification,
	NotificationCenter
} = JSG;

const sendNotification = (command, type, commandStack) => {
	// eslint-disable-next-line
	NotificationCenter.getInstance().send(new Notification(CommandStack.STACK_CHANGED_NOTIFICATION, { command, type, commandStack }));
}

class CommandStack extends JSGCommandStack {

	execute(cmd) {
		const oldsize = this.undostack.length;
		super.execute(cmd);
		if (this.undostack.length !== oldsize) {
			sendNotification(cmd, 'execute', this);
		}
	}

	redo() {
		const cmd = this.redostack.pop();
		if (cmd) {
			this.undostack.push(cmd);
			sendNotification(cmd, 'redo', this);
		}
		return cmd;
	}

	undo() {
		const cmd = this.undostack.pop();
		if (cmd) {
			this.redostack.push(cmd);
			sendNotification(cmd, 'undo', this);
		}
		return cmd;
	}
}
CommandStack.STACK_CHANGED_NOTIFICATION = 'dl.stack.changed.notification';

export default CommandStack;
