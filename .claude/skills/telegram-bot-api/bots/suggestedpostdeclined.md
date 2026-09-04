# suggestedpostdeclined

- **URL:** https://core.telegram.org/bots/api/available-types/suggestedpostdeclined
- **Summary:** SuggestedPostDeclined Describes a service message about the rejection of a suggested post. | suggested_post_message | Message | _Optional_.

# suggestedpostdeclined

SuggestedPostDeclined

Describes a service message about the rejection of a suggested post.

| Field | Type | Description |
| --- | --- | --- |
| suggested_post_message | [Message](https://core.telegram.org/bots/api#message) | _Optional_. Message containing the suggested post. Note that the [Message](https://core.telegram.org/bots/api#message)<br> object in this field will not contain the _reply_to_message_ field even if it itself is a reply. |
| comment | String | _Optional_. Comment with which the post was declined |
