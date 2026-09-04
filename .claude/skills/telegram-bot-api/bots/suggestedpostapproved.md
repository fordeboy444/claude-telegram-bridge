# suggestedpostapproved

- **URL:** https://core.telegram.org/bots/api/available-types/suggestedpostapproved
- **Summary:** SuggestedPostApproved Describes a service message about the approval of a suggested post. | suggested_post_message | Message | _Optional_.

# suggestedpostapproved

SuggestedPostApproved

Describes a service message about the approval of a suggested post.

| Field | Type | Description |
| --- | --- | --- |
| suggested_post_message | [Message](https://core.telegram.org/bots/api#message) | _Optional_. Message containing the suggested post. Note that the [Message](https://core.telegram.org/bots/api#message)<br> object in this field will not contain the _reply_to_message_ field even if it itself is a reply. |
| price | [SuggestedPostPrice](https://core.telegram.org/bots/api#suggestedpostprice) | _Optional_. Amount paid for the post |
| send_date | Integer | Date when the post will be published |
