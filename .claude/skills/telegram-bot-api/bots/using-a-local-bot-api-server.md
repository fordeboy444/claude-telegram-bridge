# Using A Local Bot Api Server

- **URL:** https://core.telegram.org/bots/api/using-a-local-bot-api-server
- **Summary:** Using a Local Bot API Server The Bot API server source code is available at telegram-bot-api .

# Using A Local Bot Api Server

Using a Local Bot API Server

The Bot API server source code is available at [telegram-bot-api](https://github.com/tdlib/telegram-bot-api)
. You can run it locally and send the requests to your own server instead of `https://api.telegram.org`. If you switch to a local Bot API server, your bot will be able to:

*   Download files without a size limit.
*   Upload files up to 2000 MB.
*   Upload files using their local path and [the file URI scheme](https://en.wikipedia.org/wiki/File_URI_scheme)
    .
*   Use an HTTP URL for the webhook.
*   Use any local IP address for the webhook.
*   Use any port for the webhook.
*   Set _max_webhook_connections_ up to 100000.
*   Receive the absolute local path as a value of the _file_path_ field without the need to download the file after a [getFile](https://core.telegram.org/bots/api#getfile)
     request.
