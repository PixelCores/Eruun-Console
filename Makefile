# Makefile for Eruun-Console

# Variables
PACKAGE_MANAGER = pnpm
BUILD_DIR = dist
OUTPUT_ARCHIVE = release.tar.gz
IMAGE_NAME ?= eruun-console
TAG ?= latest

.PHONY: all install dev build clean distclean package docker-build

all: install build

install:
	$(PACKAGE_MANAGER) install

dev:
	$(PACKAGE_MANAGER) run dev

build:
	$(PACKAGE_MANAGER) run build

clean:
	rm -rf $(BUILD_DIR)
	rm -f $(OUTPUT_ARCHIVE)

distclean: clean
	rm -rf node_modules

package: build
	tar -czf $(OUTPUT_ARCHIVE) -C $(BUILD_DIR) .
	@echo "Package created at $(OUTPUT_ARCHIVE)"

# Example:
# docker build --platform linux/amd64 \
#   --build-arg VITE_API_BASE_URL=https://eruuncli.3sdk.yu3.co/api/v1 \
#   -t docker.yu3.co/3os/eruun-console:latest .
docker-build: build
	docker build --platform linux/amd64 --build-arg VITE_API_BASE_URL=$(API_URL) -t $(IMAGE_NAME):$(TAG) .


#kubectl rollout restart deployment/eruun-console -n eruun-system

#docker build --platform linux/amd64 --build-arg VITE_API_BASE_URL=https://eruuncli.3sdk.yu3.co/api/v1 -t docker.yu3.co/3os/eruun-console:latest .  
