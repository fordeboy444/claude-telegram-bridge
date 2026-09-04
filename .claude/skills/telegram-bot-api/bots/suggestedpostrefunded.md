# suggestedpostrefunded

- **URL:** https://core.telegram.org/bots/api/available-types/suggestedpostrefunded
- **Summary:** SuggestedPostRefunded Describes a service message about a payment refund for a suggested post. | suggested_post_message | Message | _Optional_.

# suggestedpostrefunded

SuggestedPostRefunded

Describes a service message about a payment refund for a suggested post.

| Field | Type | Description |
| --- | --- | --- |
| suggested_post_message | [Message](https://core.telegram.org/bots/api#message) | _Optional_. Message containing the suggested post. Note that the [Message](https://core.telegram.org/bots/api#message)<br> object in this field will not contain the _reply_to_message_ field even if it itself is a reply. |
| reason | String | Reason for the refund. Currently, one of “post_deleted” if the post was deleted within 24 hours of being posted or removed from scheduled messages without being posted, or “payment_refunded” if the payer refunded their payment. |
