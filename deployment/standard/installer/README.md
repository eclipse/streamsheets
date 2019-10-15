# Docker
## Building Docker image
```
docker build -t cedalo/streamsheets-installer .
```

## Pushing the Docker image to the Registry
```
docker push cedalo/streamsheets-installer
```

## Installing the Streamsheet Platform from the Docker image
```
docker run -v $(pwd):/software cedalo/streamsheets-installer
```

# Configuration

## Generating a user and password for internal broker

Create the password:
```
docker exec -i -t streamsheet-platform-internal-broker mosquitto_passwd -c pw.txt cedalo
```
When prompted enter and confirm a password.

Then print the content of the password file:

```
docker exec -i -t streamsheet-platform-internal-broker cat pw.txt
```

Then copy the content and paste it into `services/docker-compose/mosquitto-internal/pw.txt`.

## Generating a user and password for default broker

Create the password:
```
docker exec -i -t broker mosquitto_passwd -c pw.txt cedalo
```
When prompted enter and confirm a password.

Then print the content of the password file:

```
docker exec -i -t broker cat pw.txt
```

Then copy the content and paste it into `services/docker-compose/mosquitto/pw.txt`.

Password for broker: fc3fd1db-274e-4eec-b952-7ff4e1270e12
