ARG BASE_IMAGE=node:12.4.0-alpine
FROM $BASE_IMAGE as builder

RUN apk update && apk upgrade && \
    apk add --no-cache yarn bash make gcc g++ python curl libc6-compat openssl && \
    npm install -g webpack webpack-cli webpack-node-externals terser-webpack-plugin 

# copy all packages without source (only package.json)
COPY --from=contextholder:latest /build ./build
WORKDIR /build
RUN node workspace-util.js prune @cedalo/service-machines && \
    yarn install --prod --frozen-lockfile && \
    # Ensure node_modules is present so we can copy it
    mkdir -p packages/service-machines/node_modules

# copy all packages with source
COPY --from=contextholder:latest /packages-with-source ./packages
RUN node workspace-util.js prune @cedalo/service-machines

FROM $BASE_IMAGE

RUN apk update && apk upgrade

COPY --from=builder /build/node_modules /app/node_modules
COPY --from=builder /build/packages /app/packages

WORKDIR /app/packages/service-machines

EXPOSE 8089

CMD [ "npm", "start" ]
