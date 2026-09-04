# messagereactionupdated

- **URL:** https://core.telegram.org/bots/api/available-types/messagereactionupdated
- **Summary:** MessageReactionUpdated This object represents a change of a reaction on a message performed by a user. | chat | Chat | The chat containing the message the user reacted to | | message_id | Integer | Unique identifier of the message inside the chat | | user | User | _Optional_.

# messagereactionupdated

MessageReactionUpdated

This object represents a change of a reaction on a message performed by a user.

| Field | Type | Description |
| --- | --- | --- |
| chat | [Chat](https://core.telegram.org/bots/api#chat) | The chat containing the message the user reacted to |
| message_id | Integer | Unique identifier of the message inside the chat |
| user | [User](https://core.telegram.org/bots/api#user) | _Optional_. The user that changed the reaction, if the user isn't anonymous |
| actor_chat | [Chat](https://core.telegram.org/bots/api#chat) | _Optional_. The chat on behalf of which the reaction was changed, if the user is anonymous |
| date | Integer | Date of the change in Unix time |
| old_reaction | Array of [ReactionType](https://core.telegram.org/bots/api#reactiontype) | Previous list of reaction types that were set by the user |
| new_reaction | Array of [ReactionType](https://core.telegram.org/bots/api#reactiontype) | New list of reaction types that have been set by the user |
