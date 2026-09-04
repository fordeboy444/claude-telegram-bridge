# [](https://core.telegram.org/bots/api#inputtextmessagecontent)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#inline-mode)\/[](https://core.telegram.org/bots/api#inputtextmessagecontent)\
- **Summary:** InputTextMessageContent\ of a text message to be sent as the result of an inline query.\ | message_text | String | Text of the message to be sent, 1-4096 characters |\ | parse_mode | String | _Optional_.

# \

InputTextMessageContent\
\
Represents the [content](https://core.telegram.org/bots/api#inputmessagecontent)\
 of a text message to be sent as the result of an inline query.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| message_text | String | Text of the message to be sent, 1-4096 characters |\
| parse_mode | String | _Optional_. Mode for parsing entities in the message text. See [formatting options](https://core.telegram.org/bots/api#formatting-options)<br> for more details. |\
| entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. List of special entities that appear in message text, which can be specified instead of _parse_mode_ |\
| link_preview_options | [LinkPreviewOptions](https://core.telegram.org/bots/api#linkpreviewoptions) | _Optional_. Link preview generation options for the message |\
\
