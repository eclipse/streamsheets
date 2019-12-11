#!/bin/bash -e
FILE=/etc/mosquitto-default-credentials/pw.txt
FILE_CLEAR=/etc/mosquitto-default-credentials/pw_clear.txt
if [ -s $FILE ]
then
	echo "Password for default Mosquitto exists"
else
	echo "Password for default Mosquitto does not exist, will create one."
	touch $FILE
	PASSWORD=$(openssl rand -base64 32)
	mosquitto_passwd -b $FILE cedalo $PASSWORD
	echo $PASSWORD >> $FILE_CLEAR
	echo "Hashed password for Mosquitto broker is located in $FILE."
	echo "Clear text password for Mosquitto broker is located in $FILE_CLEAR."
	echo "For security reasons please copy the password from $FILE_CLEAR and delete that file afterwards."
fi
/usr/bin/supervisord -c /etc/supervisord.conf
