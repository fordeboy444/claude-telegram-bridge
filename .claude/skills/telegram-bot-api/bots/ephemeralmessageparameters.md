# ephemeralmessageparameters

- **URL:** https://core.telegram.org/bots/api/available-types/ephemeralmessageparameters
- **Summary:** EphemeralMessageParameters | receiver_user_id | Integer | Identifier of the user who will receive the message.

# ephemeralmessageparameters

EphemeralMessageParameters

| Field | Type | Description |
| --- | --- | --- |
| receiver_user_id | Integer | Identifier of the user who will receive the message. It is not guaranteed that the user will receive the message, especially if they are offline. See [here](https://core.telegram.org/bots/api#ephemeral-messages-and-commands)<br> for more details. |
| callback_query_id | String | _Optional_. Identifier of the callback query which triggered the message, if any |
| replace_callback_query_message | Boolean | _Optional_. Pass _True_ if the ephemeral message must be shown in place of the original message. Must be _False_ for callback queries from ephemeral messages, which must be edited using regular _editEphemeralMessage…_ methods. |
