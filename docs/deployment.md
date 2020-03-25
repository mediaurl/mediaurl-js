# Deployment guide

Instructions on how to deploy a WATCHED addon to various hosting providers.

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
