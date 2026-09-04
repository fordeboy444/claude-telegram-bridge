# [](https://core.telegram.org/bots/api#editmessagecaption)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#updating-messages)\/[](https://core.telegram.org/bots/api#editmessagecaption)\
- **Summary:** Use this method to edit captions of messages.

# \

editMessageCaption\
\
Use this method to edit captions of messages. On success, if the edited message is not an inline message, the edited [Message](https://core.telegram.org/bots/api#message)\
 is returned, otherwise _True_ is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within **48 hours** from the time they were sent.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| business_connection_id | String | Optional | Unique identifier of the business connection on behalf of which the message to be edited was sent |\
| chat_id | Integer or String | Optional | Required if _inline_message_id_ is not specified. Unique identifier for the target chat or username of the target bot, supergroup or channel in the format `@username`. |\
| message_id | Integer | Optional | Required if _inline_message_id_ is not specified. Identifier of the message to edit. |\
| inline_message_id | String | Optional | Required if _chat_id_ and _message_id_ are not specified. Identifier of the inline message. |\
| caption | String | Optional | New caption of the message, 0-1024 characters after entities parsing |\
| parse_mode | String | Optional | Mode for parsing entities in the message caption. See [formatting options](https://core.telegram.org/bots/api#formatting-options)<br> for more details. |\
| caption_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | Optional | A JSON-serialized list of special entities that appear in the caption, which can be specified instead of _parse_mode_ |\
| show_caption_above_media | Boolean | Optional | Pass _True_ if the caption must be shown above the message media. Supported only for animation, photo and video messages. |\
| reply_markup | [InlineKeyboardMarkup](https://core.telegram.org/bots/api#inlinekeyboardmarkup) | Optional | A JSON-serialized object for an [inline keyboard](https://core.telegram.org/bots/features#inline-keyboards) |\
\
