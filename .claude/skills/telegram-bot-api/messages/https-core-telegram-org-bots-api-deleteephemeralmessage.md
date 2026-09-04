# [](https://core.telegram.org/bots/api#deleteephemeralmessage)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#updating-messages)\/[](https://core.telegram.org/bots/api#deleteephemeralmessage)\
- **Summary:** deleteEphemeralMessage\ Use this method to delete an ephemeral message.

# \

deleteEphemeralMessage\
\
Use this method to delete an ephemeral message. Note that it is not guaranteed that the user will receive the message deletion event, especially if they are offline. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target supergroup in the format `@username` |\
| receiver_user_id | Integer | Yes | Identifier of the user who received the message |\
| ephemeral_message_id | Integer | Yes | Identifier of the ephemeral message to delete |\
\
