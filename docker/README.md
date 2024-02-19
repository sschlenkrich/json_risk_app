# JSONRisk App Docker Configuration

In this folder, we specify the configuration for running JSONRisk App in a [Docker](https://en.wikipedia.org/wiki/Docker_(software)) container.

## Images and Containers

We specify a [*release* image](./Dockerfile) and a [*development* image](./Dockerfile.dev). The *release* image is intended to be used for running a stable version of JSONRisk App. The *development* image is intended to facilitate JSONRisk development.

The JSONRisk App images are based on official [nginx images](https://hub.docker.com/_/nginx). The images are supplemented by PHP, Node.js and some utilities. Entry point of the images is the [jr_start](../jr_start) script.

The release image and the development image differ in how the JSONRisk App source code is embedded. The release image incorporates a static code release into the image. The development image mounts the current repository code into the container as a volume.

Images are build and containers are run via `docker compose`. Here, we also provide [release configuration](./compose.yaml) and [development configuration](./compose.dev.yaml).


## JSONRisk Data

JSONRisk data is supposed to be stored in folder `../.var`. This folder is mounted into the container.

For custom release images the host data folder can be amended via the volume specification in the [compose](./compose.yaml) file.


## Running JSONRisk App Containers

A container of the release image can be started from the `docker/` folder via

```
docker compose -f compose.yaml up
```

A container of the development image can be started from the `docker/` folder via

```
docker compose -f compose.dev.yaml up
```

Upon successful start, the JSONRisk App can be accessed via (localhost)[http://localhost:8080].
