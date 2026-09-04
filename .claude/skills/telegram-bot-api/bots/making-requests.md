# Making Requests

- **URL:** https://core.telegram.org/bots/api/making-requests
- **Summary:** All queries to the Telegram Bot API must be served over HTTPS and need to be presented in this form: `https://api.telegram.org/bot<token>/METHOD_NAME`.

# Making Requests

Making requests

All queries to the Telegram Bot API must be served over HTTPS and need to be presented in this form: `https://api.telegram.org/bot<token>/METHOD_NAME`. Like this for example:

    https://api.telegram.org/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/getMe

We support **GET** and **POST** HTTP methods. We support four ways of passing parameters in Bot API requests:

*   [URL query string](https://en.wikipedia.org/wiki/Query_string)
    
*   application/x-www-form-urlencoded
*   application/json (except for uploading files)
*   multipart/form-data (use to upload files)

The response contains a JSON object, which always has a Boolean field 'ok' and may have an optional String field 'description' with a human-readable description of the result. If 'ok' equals _True_, the request was successful and the result of the query can be found in the 'result' field. In case of an unsuccessful request, 'ok' equals _False_ and the error is explained in the 'description'. An Integer 'error_code' field is also returned, but its contents are subject to change in the future. Some errors may also have an optional field 'parameters' of the type [ResponseParameters](https://core.telegram.org/bots/api#responseparameters)
, which can help to automatically handle the error.

*   All methods in the Bot API are case-insensitive.
*   All queries must be made using UTF-8.
