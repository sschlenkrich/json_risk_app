# JSON Risk App Docker Configuration

In this folder, we specify the configuration for running JSON Risk App in a [Docker](https://en.wikipedia.org/wiki/Docker_(software)) container.

## Image and Container

The JSON Risk App image is based on the official [ubuntu image](https://hub.docker.com/_/ubuntu). The image is supplemented by nginx, PHP, PHP-FPM, Node.js and some utilities.

The release image incorporates a static code release into the image. For development purposes, it is possible to mount the current repository code into the container, replacing the static release.

It is convenient to build images and run containers via `docker compose`. Here, we provide a [release compose file](./compose.yaml) and a [development compose file](./compose.dev.yaml).

## JSON Risk Data and Config

The image does not contain the JSON Risk configuration files `.config`, `.security.json` and `.cluster.json`. There are multiple options how to connect the container with data and configuration: 

 - Mount the local JSON Risk repository into the container under the path `/app`. This is what the [development compose file](./compose.dev.yaml) does. Equivalently, run `docker run` with the option `--mount type=bind,source=/path/to/repository,destination=/app`. JSON Risk data is supposed to be stored within the repository, it resides under `path/to/repositry/.var` if not configured otherwise in `/path/to/repository/.config`.
 - Mount a directory with instance data into the container under the path `/data`. In that case, `/data` is used as data directory for JSON Risk instance data. If the mounted directory also contains files `.config`, `./security.json` or `.cluster.json`, these files are used. This is what the [release compose file](./compose.yaml) does. In fact, it mounts the `.var` directory from the local repository into `/data` in the container. Equivalently, run `docker run` with the option `--mount type=bind,source=/path/to/datadif,destination=/data`.

For custom release images the host data folder can be amended via the volume specification in the [release compose file](./compose.yaml) file.

## Running JSON Risk App Containers

A container with release configuration can be started from the `docker/` folder via

```
docker compose -f compose.yaml up
```

A container with development configuration can be started from the `docker/` folder via

```
docker compose -f compose.dev.yaml up
```

Upon successful start, the JSONRisk App can be accessed via (localhost)[http://localhost:8080].
