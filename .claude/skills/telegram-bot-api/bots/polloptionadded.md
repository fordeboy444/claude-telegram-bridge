# polloptionadded

- **URL:** https://core.telegram.org/bots/api/available-types/polloptionadded
- **Summary:** Describes a service message about an option added to a poll. | poll_message | MaybeInaccessibleMessage | _Optional_.

# polloptionadded

PollOptionAdded

Describes a service message about an option added to a poll.

| Field | Type | Description |
| --- | --- | --- |
| poll_message | [MaybeInaccessibleMessage](https://core.telegram.org/bots/api#maybeinaccessiblemessage) | _Optional_. Message containing the poll to which the option was added, if known. Note that the [Message](https://core.telegram.org/bots/api#message)<br> object in this field will not contain the _reply_to_message_ field even if it itself is a reply. |
| option_persistent_id | String | Unique identifier of the added option |
| option_text | String | Option text |
| option_text_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. Special entities that appear in the _option_text_ |
