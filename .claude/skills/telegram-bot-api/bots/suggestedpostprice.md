# suggestedpostprice

- **URL:** https://core.telegram.org/bots/api/available-types/suggestedpostprice
- **Summary:** Describes the price of a suggested post. | currency | String | Currency in which the post will be paid.

# suggestedpostprice

SuggestedPostPrice

Describes the price of a suggested post.

| Field | Type | Description |
| --- | --- | --- |
| currency | String | Currency in which the post will be paid. Currently, must be one of “XTR” for Telegram Stars or “TON” for TON grams. |
| amount | Integer | The amount of the currency that will be paid for the post in the _smallest units_ of the currency, i.e. Telegram Stars or nanograms. Currently, price in Telegram Stars must be between 5 and 100000, and price in nanograms must be between 10000000 and 10000000000000. |
