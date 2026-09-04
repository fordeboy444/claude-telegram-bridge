# pollanswer

- **URL:** https://core.telegram.org/bots/api/available-types/pollanswer
- **Summary:** This object represents an answer of a user in a non-anonymous poll. | poll_id | String | Unique poll identifier | | voter_chat | Chat | _Optional_.

# pollanswer

PollAnswer

This object represents an answer of a user in a non-anonymous poll.

| Field | Type | Description |
| --- | --- | --- |
| poll_id | String | Unique poll identifier |
| voter_chat | [Chat](https://core.telegram.org/bots/api#chat) | _Optional_. The chat that changed the answer to the poll, if the voter is anonymous |
| user | [User](https://core.telegram.org/bots/api#user) | _Optional_. The user that changed the answer to the poll, if the voter isn't anonymous |
| option_ids | Array of Integer | 0-based identifiers of chosen answer options. May be empty if the vote was retracted. |
| option_persistent_ids | Array of String | Persistent identifiers of the chosen answer options. May be empty if the vote was retracted. |
