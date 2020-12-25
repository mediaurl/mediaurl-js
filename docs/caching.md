# Cache

Caching can have many benefits for server processes. With the `ctx.cache` function you have access to a `CacheHandler` instance. Please see the function documentation for more infos about this.

By default, all cache keys get's prefixed with the addon ID. You can change this by changing the `prefix` option.

_When running in a real-world environment with more than one process and maybe more than one server, the "remote tasks" functions (`ctx.fetch` and `ctx.recaptcha`) need a cache to be enabled which is reachable from all processes._

Currently there are the following caching engines available:

## `MemoryCache`

In memory cache, this is the default.

## `DiskCache`

A cache which uses the file system for storage. This is the most easy to setup cache and can be very helpful during development.

To enable this, set the environment variable `DISK_CACHE` to a path.

```shell
export DISK_CACHE=/data/mediaurl-cache
npm run develop
```

## `RedisCache`

This cache engine is using the [redis](https://www.npmjs.com/package/redis) package. To activate it, set the environment variable `REDIS_CACHE` to a redis connection URL.

```shell
export REDIS_CACHE=redis://localhost
npm run develop
```

## `MongoCache`

This cache engine is using [mongodb](https://www.mongodb.com/) as it's backend. To activate it, set the environment variable `MONGO_CACHE` to a mongodb connection URL.

```shell
export MONGO_CACHE=mongodb://localhost/database
npm run develop
```
