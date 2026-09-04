# suggestedpostapprovalfailed

- **URL:** https://core.telegram.org/bots/api/available-types/suggestedpostapprovalfailed
- **Summary:** SuggestedPostApprovalFailed Describes a service message about the failed approval of a suggested post.

# suggestedpostapprovalfailed

SuggestedPostApprovalFailed

Describes a service message about the failed approval of a suggested post. Currently, only caused by insufficient user funds at the time of approval.

| Field | Type | Description |
| --- | --- | --- |
| suggested_post_message | [Message](https://core.telegram.org/bots/api#message) | _Optional_. Message containing the suggested post whose approval has failed. Note that the [Message](https://core.telegram.org/bots/api#message)<br> object in this field will not contain the _reply_to_message_ field even if it itself is a reply. |
| price | [SuggestedPostPrice](https://core.telegram.org/bots/api#suggestedpostprice) | Expected price of the post |
