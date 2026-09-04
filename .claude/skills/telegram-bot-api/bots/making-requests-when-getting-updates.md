# making requests when getting updates

- **URL:** https://core.telegram.org/bots/api/making-requests/making-requests-when-getting-updates
- **Summary:** Making requests when getting updates If you're using **webhooks** , you can perform a request to the Bot API while sending an answer to the webhook.

# making requests when getting updates

Making requests when getting updates

If you're using [**webhooks**](https://core.telegram.org/bots/api#getting-updates)
, you can perform a request to the Bot API while sending an answer to the webhook. Use either _application/json_ or _application/x-www-form-urlencoded_ or _multipart/form-data_ response content type for passing parameters. Specify the method to be invoked in the _method_ parameter of the request. It's not possible to know that such a request was successful or get its result.

> Please see our [FAQ](https://core.telegram.org/bots/faq#how-can-i-make-requests-in-response-to-updates)
>  for examples.
