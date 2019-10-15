import { useRef, useEffect } from 'react';
import JSG from '@cedalo/jsg-ui';

export const useJSGNotification = (notifications, handler) => {
	const ref = useRef({ handler });
	useEffect(() => {
		JSG.NotificationCenter.getInstance().register(ref.current, notifications, 'handler');
		return () => JSG.NotificationCenter.getInstance().unregister(ref.current, notifications);
	}, []);
};
