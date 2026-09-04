# [](https://core.telegram.org/bots/api#answerprecheckoutquery)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#payments)\/[](https://core.telegram.org/bots/api#answerprecheckoutquery)\
- **Summary:** answerPreCheckoutQuery\ Once the user has confirmed their payment and shipping details, the Bot API sends the final confirmation in the form of an Update\ with the field _pre_checkout_query_.

# \

answerPreCheckoutQuery\
\
Once the user has confirmed their payment and shipping details, the Bot API sends the final confirmation in the form of an [Update](https://core.telegram.org/bots/api#update)\
 with the field _pre_checkout_query_. Use this method to respond to such pre-checkout queries. On success, _True_ is returned. **Note:** The Bot API must receive an answer within 10 seconds after the pre-checkout query was sent.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| pre_checkout_query_id | String | Yes | Unique identifier for the query to be answered |\
| ok  | Boolean | Yes | Specify _True_ if everything is alright (goods are available, etc.) and the bot is ready to proceed with the order. Use _False_ if there are any problems. |\
| error_message | String | Optional | Required if _ok_ is _False_. Error message in human readable form that explains the reason for failure to proceed with the checkout (e.g. "Sorry, somebody just bought the last of our amazing black T-shirts while you were busy filling out your payment details. Please choose a different color or garment!"). Telegram will display this message to the user. |\
\
