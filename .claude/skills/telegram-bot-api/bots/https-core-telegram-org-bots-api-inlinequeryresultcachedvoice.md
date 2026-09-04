# [](https://core.telegram.org/bots/api#inlinequeryresultcachedvoice)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#inline-mode)\/[](https://core.telegram.org/bots/api#inlinequeryresultcachedvoice)\
- **Summary:** InlineQueryResultCachedVoice\ Represents a link to a voice message stored on the Telegram servers.

# \

InlineQueryResultCachedVoice\
\
Represents a link to a voice message stored on the Telegram servers. By default, this voice message will be sent by the user. Alternatively, you can use _input_message_content_ to send a message with the specified content instead of the voice message.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the result, must be _voice_ |\
| id  | String | Unique identifier for this result, 1-64 bytes |\
| voice_file_id | String | A valid file identifier for the voice message |\
| title | String | Voice message title |\
| caption | String | _Optional_. Caption, 0-1024 characters after entities parsing |\
| parse_mode | String | _Optional_. Mode for parsing entities in the voice message caption. See [formatting options](https://core.telegram.org/bots/api#formatting-options)<br> for more details. |\
| caption_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. List of special entities that appear in the caption, which can be specified instead of _parse_mode_ |\
| reply_markup | [InlineKeyboardMarkup](https://core.telegram.org/bots/api#inlinekeyboardmarkup) | _Optional_. [Inline keyboard](https://core.telegram.org/bots/features#inline-keyboards)<br> attached to the message |\
| input_message_content | [InputMessageContent](https://core.telegram.org/bots/api#inputmessagecontent) | _Optional_. Content of the message to be sent instead of the voice message |\
\
