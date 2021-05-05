FROM rabbitmq:3-management

# Define environment variables.
ENV RABBITMQ_USER streamuser
ENV RABBITMQ_PASSWORD streampass
ENV RABBITMQ_VHOST streamshost
ENV RABBITMQ_PID_FILE /var/lib/rabbitmq/mnesia/rabbitmq

ADD init.sh /init.sh
RUN chmod +x /init.sh
EXPOSE 15672
EXPOSE 5672
# Define default command
CMD ["/init.sh"]
