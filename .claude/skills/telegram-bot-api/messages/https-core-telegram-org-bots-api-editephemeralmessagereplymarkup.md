# [](https://core.telegram.org/bots/api#editephemeralmessagereplymarkup)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#updating-messages)\/[](https://core.telegram.org/bots/api#editephemeralmessagereplymarkup)\
- **Summary:** editEphemeralMessageReplyMarkup\ Use this method to edit only the reply markup of an ephemeral message.

# \

editEphemeralMessageReplyMarkup\
\
Use this method to edit only the reply markup of an ephemeral message. Note that it is not guaranteed that the user will receive the message edit event, especially if they are offline. On success, _True_ is returned.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target supergroup in the format `@username` |\
| receiver_user_id | Integer | Yes | Identifier of the user who received the message |\
| ephemeral_message_id | Integer | Yes | Identifier of the ephemeral message to edit |\
| reply_markup | [InlineKeyboardMarkup](https://core.telegram.org/bots/api#inlinekeyboardmarkup) | Optional | A JSON-serialized object for an [inline keyboard](https://core.telegram.org/bots/features#inline-keyboards) |\
\
