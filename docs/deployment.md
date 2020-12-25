# Deployment guide

Instructions on how to deploy a MediaURL addon to various hosting providers.

- [Heroku](#Heroku)

## Heroku

**Requirements**

Make sure to have [Heroku](https://www.heroku.com/) account and [Heroku Toolbelt](https://devcenter.heroku.com/articles/heroku-cli) installed.

**Deployment**

Go to your addon directory, then run the following code:

```shell
# Create heroku application
$ heroku create your-app-name-123

# Set env variables (optional)
$ heroku config:set MY_CUSTOM_VALUE=foobar

# Execute deploy
$ git push heroku master
```

## Vercel (_ex now.sh_)

**Requirements**

Account on vercel.com and [Now CLI](https://www.npmjs.com/package/now) (`npm i -g now`) installed.

**Deployment**

Go to your addon directory, then run the following code:

```shell
# Add files related to vercel
$ npx @mediaurl/create init-vercel

# Link project
$ now

# Set cache url (REDIS_CACHE is also supported)
$ now env add MONGO_CACHE

# Deploy
$ now deploy
```

Note: [mlab.com](https://mlab.com/) offers free mongo instances (up to 0.5 GB storage)
