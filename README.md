# express-rest-postgres

This service runs on `Node.js`, a JavaScript runtime built on Chrome's V8 JavaScript engine.

## Dependencies

This service uses `express.js`, a fast, unopinionated, minimalist web framework for Node.js.

- node.js 14.2
- express.js 4.17.1

## Getting Started

> Run `make help` for more details about available make commands

Generate TLS certificates and build the server image

```bash
make init
```

Create a container from the previously built image and run it in the background

```bash
make up-bg
```

Get status information from the running container

```bash
make status
```

When done, stop and remove the container

```bash
make nuke
```
