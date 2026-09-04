# [](https://core.telegram.org/bots/api#answershippingquery)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#payments)\/[](https://core.telegram.org/bots/api#answershippingquery)\
- **Summary:** answerShippingQuery\ If you sent an invoice requesting a shipping address and the parameter _is_flexible_ was specified, the Bot API will send an Update\ with a _shipping_query_ field to the bot.

# \

answerShippingQuery\
\
If you sent an invoice requesting a shipping address and the parameter _is_flexible_ was specified, the Bot API will send an [Update](https://core.telegram.org/bots/api#update)\
 with a _shipping_query_ field to the bot. Use this method to reply to shipping queries. On success, _True_ is returned.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| shipping_query_id | String | Yes | Unique identifier for the query to be answered |\
| ok  | Boolean | Yes | Pass _True_ if delivery to the specified address is possible and _False_ if there are any problems (for example, if delivery to the specified address is not possible) |\
| shipping_options | Array of [ShippingOption](https://core.telegram.org/bots/api#shippingoption) | Optional | Required if _ok_ is _True_. A JSON-serialized Array of available shipping options. |\
| error_message | String | Optional | Required if _ok_ is _False_. Error message in human readable form that explains why it is impossible to complete the order (e.g. “Sorry, delivery to your desired address is unavailable”). Telegram will display this message to the user. |\
\
