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
import { useRef, useEffect } from 'react';
import JSG from '@cedalo/jsg-ui';

export const useJSGNotification = (notifications, handler) => {
	const ref = useRef({ handler });
	useEffect(() => {
		JSG.NotificationCenter.getInstance().register(ref.current, notifications, 'handler');
		return () => JSG.NotificationCenter.getInstance().unregister(ref.current, notifications);
	}, []);
};
