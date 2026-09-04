# suggestedpostpaid

- **URL:** https://core.telegram.org/bots/api/available-types/suggestedpostpaid
- **Summary:** Describes a service message about a successful payment for a suggested post. | suggested_post_message | Message | _Optional_.

# suggestedpostpaid

SuggestedPostPaid

Describes a service message about a successful payment for a suggested post.

| Field | Type | Description |
| --- | --- | --- |
| suggested_post_message | [Message](https://core.telegram.org/bots/api#message) | _Optional_. Message containing the suggested post. Note that the [Message](https://core.telegram.org/bots/api#message)<br> object in this field will not contain the _reply_to_message_ field even if it itself is a reply. |
| currency | String | Currency in which the payment was made. Currently, one of “XTR” for Telegram Stars or “TON” for TON grams. |
| amount | Integer | _Optional_. The amount of the currency that was received by the channel in nanograms; for payments in TON grams only |
| star_amount | [StarAmount](https://core.telegram.org/bots/api#staramount) | _Optional_. The amount of Telegram Stars that was received by the channel; for payments in Telegram Stars only |
