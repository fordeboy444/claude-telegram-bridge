# [](https://core.telegram.org/bots/api#labeledprice)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#payments)\/[](https://core.telegram.org/bots/api#labeledprice)\
- **Summary:** This object represents a portion of the price for goods or services.\ | label | String | Portion label |\ | amount | Integer | Price of the product in the _smallest units_ of the currency<br> (integer, **not** float/double).

# \

LabeledPrice\
\
This object represents a portion of the price for goods or services.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| label | String | Portion label |\
| amount | Integer | Price of the product in the _smallest units_ of the [currency](https://core.telegram.org/bots/payments#supported-currencies)<br> (integer, **not** float/double). For example, for a price of `US$ 1.45` pass `amount = 145`. See the _exp_ parameter in [currencies.json](https://core.telegram.org/bots/payments/currencies.json)<br>, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). |\
\
