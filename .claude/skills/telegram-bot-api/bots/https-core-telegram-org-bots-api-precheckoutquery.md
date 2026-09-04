# [](https://core.telegram.org/bots/api#precheckoutquery)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#payments)\/[](https://core.telegram.org/bots/api#precheckoutquery)\
- **Summary:** This object contains information about an incoming pre-checkout query.\ | id  | String | Unique query identifier |\ | from | User | User who sent the query |\ | currency | String | Three-letter ISO 4217 currency<br> code, or “XTR” for payments in Telegram Stars |\ | total_amount | Integer | Total...

# \

PreCheckoutQuery\
\
This object contains information about an incoming pre-checkout query.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| id  | String | Unique query identifier |\
| from | [User](https://core.telegram.org/bots/api#user) | User who sent the query |\
| currency | String | Three-letter ISO 4217 [currency](https://core.telegram.org/bots/payments#supported-currencies)<br> code, or “XTR” for payments in [Telegram Stars](https://t.me/BotNews/90) |\
| total_amount | Integer | Total price in the _smallest units_ of the currency (integer, **not** float/double). For example, for a price of `US$ 1.45` pass `amount = 145`. See the _exp_ parameter in [currencies.json](https://core.telegram.org/bots/payments/currencies.json)<br>, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). |\
| invoice_payload | String | Bot-specified invoice payload |\
| shipping_option_id | String | _Optional_. Identifier of the shipping option chosen by the user |\
| order_info | [OrderInfo](https://core.telegram.org/bots/api#orderinfo) | _Optional_. Order information provided by the user |\
\
