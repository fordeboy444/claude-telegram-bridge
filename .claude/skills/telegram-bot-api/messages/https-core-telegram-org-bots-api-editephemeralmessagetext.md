# [](https://core.telegram.org/bots/api#editephemeralmessagetext)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#updating-messages)\/[](https://core.telegram.org/bots/api#editephemeralmessagetext)\
- **Summary:** editEphemeralMessageText\ Use this method to edit an ephemeral text or rich message.

# \

editEphemeralMessageText\
\
Use this method to edit an ephemeral text or rich message. Note that it is not guaranteed that the user will receive the message edit event, especially if they are offline. On success, _True_ is returned.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target supergroup in the format `@username` |\
| receiver_user_id | Integer | Yes | Identifier of the user who received the message |\
| ephemeral_message_id | Integer | Yes | Identifier of the ephemeral message to edit |\
| text | String | Optional | New text of the message, 1-4096 characters after entity parsing; required if _rich_message_ isn't specified |\
| parse_mode | String | Optional | Mode for parsing entities in the message text. See [formatting options](https://core.telegram.org/bots/api#formatting-options)<br> for more details. |\
| entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | Optional | A JSON-serialized list of special entities that appear in message text, which can be specified instead of _parse_mode_ |\
| rich_message | [InputRichMessage](https://core.telegram.org/bots/api#inputrichmessage) | Optional | New rich content of the message; required if _text_ isn't specified |\
| link_preview_options | [LinkPreviewOptions](https://core.telegram.org/bots/api#linkpreviewoptions) | Optional | Link preview generation options for the message |\
| reply_markup | [InlineKeyboardMarkup](https://core.telegram.org/bots/api#inlinekeyboardmarkup) | Optional | A JSON-serialized object for an [inline keyboard](https://core.telegram.org/bots/features#inline-keyboards) |\
\
