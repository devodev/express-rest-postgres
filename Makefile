# inspired by: https://gist.github.com/mpneuried/0594963ad38e68917ef189b4e6a269db

# import config.
# You can change the default config with `make cnf="config_special.env" build`
cnf ?= config.env
include $(cnf)
export $(shell sed 's/=.*//' $(cnf))

# Main
.PHONY: help

help: ## This help.
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.DEFAULT_GOAL := help

# TASKS
build: npm-install ## Build the image
	docker build -t $(APP_NAME) .

build-nc: npm-install ## Build the image without using the cache
	docker build --no-cache -t $(APP_NAME) .

run: ## Run the image built using the build* commands inside a new container, using `config.env` as env file
	docker run -i -t --rm --env-file=./config.env -p=$(APP_PORT):$(APP_PORT) --name="$(APP_NAME)" $(APP_NAME)

run-bg: ## Run the image built using the build* commands inside a new container, in the background
	docker run -d --env-file=./config.env -p=$(APP_PORT):$(APP_PORT) --name="$(APP_NAME)" $(APP_NAME)

status: ## Get the container status
	docker ps -f name="$(APP_NAME)"

stop: ## Stop the container
	docker stop $(APP_NAME)

rm: ## Remove the container
	docker rm $(APP_NAME)

# HELPER COMMANDS
npm-install: ## Install depewndencies and generate package.lock.json
	npm install
gencerts: ## Generate self-signed certificate and key
	openssl req \
       -subj '$(CERT_SUBJ)' \
       -newkey rsa:2048 -nodes -keyout $(CERT_PATH)/$(CERT_NAME).key \
       -x509 -days 365 -out $(CERT_PATH)/$(CERT_NAME).pem

# AGGREGATE COMMANDS
init: gencerts build-nc ## Generate certs and build the container without using the cache
up: build run ## Run container on port configured in `config.env` (Alias to run)
up-bg: build run-bg status ## Run container in the background on port configured in `config.env` (Alias to run)
nuke: stop rm ## Stop and rm a running container
