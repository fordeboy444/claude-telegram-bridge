# polloption

- **URL:** https://core.telegram.org/bots/api/available-types/polloption
- **Summary:** This object contains information about one answer option in a poll. | persistent_id | String | Unique identifier of the option, persistent on option addition and deletion | | text | String | Option text, 1-100 characters | | text_entities | Array of MessageEntity | _Optional_.

# polloption

PollOption

This object contains information about one answer option in a poll.

| Field | Type | Description |
| --- | --- | --- |
| persistent_id | String | Unique identifier of the option, persistent on option addition and deletion |
| text | String | Option text, 1-100 characters |
| text_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. Special entities that appear in the option _text_. Currently, only custom emoji entities are allowed in poll option texts |
| media | [PollMedia](https://core.telegram.org/bots/api#pollmedia) | _Optional_. Media added to the poll option |
| voter_count | Integer | Number of users who voted for this option; may be 0 if unknown |
| added_by_user | [User](https://core.telegram.org/bots/api#user) | _Optional_. User who added the option; omitted if the option wasn't added by a user after poll creation |
| added_by_chat | [Chat](https://core.telegram.org/bots/api#chat) | _Optional_. Chat that added the option; omitted if the option wasn't added by a chat after poll creation |
| addition_date | Integer | _Optional_. Point in time (Unix timestamp) when the option was added; omitted if the option existed in the original poll |
