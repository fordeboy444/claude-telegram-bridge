# [](https://core.telegram.org/bots/api#inputinvoicemessagecontent)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#inline-mode)\/[](https://core.telegram.org/bots/api#inputinvoicemessagecontent)\
- **Summary:** InputInvoiceMessageContent\ of an invoice message to be sent as the result of an inline query.\ | title | String | Product name, 1-32 characters |\ | description | String | Product description, 1-255 characters |\ | payload | String | Bot-defined invoice payload, 1-128 bytes.

# \

InputInvoiceMessageContent\
\
Represents the [content](https://core.telegram.org/bots/api#inputmessagecontent)\
 of an invoice message to be sent as the result of an inline query.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| title | String | Product name, 1-32 characters |\
| description | String | Product description, 1-255 characters |\
| payload | String | Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use it for your internal processes. |\
| provider_token | String | _Optional_. Payment provider token, obtained via [@BotFather](https://t.me/botfather)<br>. Pass an empty string for payments in [Telegram Stars](https://t.me/BotNews/90)<br>. |\
| currency | String | Three-letter ISO 4217 currency code, see [more on currencies](https://core.telegram.org/bots/payments#supported-currencies)<br>. Pass “XTR” for payments in [Telegram Stars](https://t.me/BotNews/90)<br>. |\
| prices | Array of [LabeledPrice](https://core.telegram.org/bots/api#labeledprice) | Price breakdown, a JSON-serialized list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.). Must contain exactly one item for payments in [Telegram Stars](https://t.me/BotNews/90)<br>. |\
| max_tip_amount | Integer | _Optional_. The maximum accepted amount for tips in the _smallest units_ of the currency (integer, **not** float/double). For example, for a maximum tip of `US$ 1.45` pass `max_tip_amount = 145`. See the _exp_ parameter in [currencies.json](https://core.telegram.org/bots/payments/currencies.json)<br>, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). Defaults to 0. Not supported for payments in [Telegram Stars](https://t.me/BotNews/90)<br>. |\
| suggested_tip_amounts | Array of Integer | _Optional_. A JSON-serialized Array of suggested amounts of tip in the _smallest units_ of the currency (integer, **not** float/double). At most 4 suggested tip amounts can be specified. The suggested tip amounts must be positive, passed in a strictly increased order and must not exceed _max_tip_amount_. |\
| provider_data | String | _Optional_. A JSON-serialized object for data about the invoice, which will be shared with the payment provider. A detailed description of the required fields should be provided by the payment provider. |\
| photo_url | String | _Optional_. URL of the product photo for the invoice. Can be a photo of the goods or a marketing image for a service. |\
| photo_size | Integer | _Optional_. Photo size in bytes |\
| photo_width | Integer | _Optional_. Photo width |\
| photo_height | Integer | _Optional_. Photo height |\
| need_name | Boolean | _Optional_. Pass _True_ if you require the user's full name to complete the order. Ignored for payments in [Telegram Stars](https://t.me/BotNews/90)<br>. |\
| need_phone_number | Boolean | _Optional_. Pass _True_ if you require the user's phone number to complete the order. Ignored for payments in [Telegram Stars](https://t.me/BotNews/90)<br>. |\
| need_email | Boolean | _Optional_. Pass _True_ if you require the user's email address to complete the order. Ignored for payments in [Telegram Stars](https://t.me/BotNews/90)<br>. |\
| need_shipping_address | Boolean | _Optional_. Pass _True_ if you require the user's shipping address to complete the order. Ignored for payments in [Telegram Stars](https://t.me/BotNews/90)<br>. |\
| send_phone_number_to_provider | Boolean | _Optional_. Pass _True_ if the user's phone number should be sent to the provider. Ignored for payments in [Telegram Stars](https://t.me/BotNews/90)<br>. |\
| send_email_to_provider | Boolean | _Optional_. Pass _True_ if the user's email address should be sent to the provider. Ignored for payments in [Telegram Stars](https://t.me/BotNews/90)<br>. |\
| is_flexible | Boolean | _Optional_. Pass _True_ if the final price depends on the shipping method. Ignored for payments in [Telegram Stars](https://t.me/BotNews/90)<br>. |\
\
