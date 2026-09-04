# [](https://core.telegram.org/bots/api#inlinequeryresultcacheddocument)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#inline-mode)\/[](https://core.telegram.org/bots/api#inlinequeryresultcacheddocument)\
- **Summary:** InlineQueryResultCachedDocument\ Represents a link to a file stored on the Telegram servers.

# \

InlineQueryResultCachedDocument\
\
Represents a link to a file stored on the Telegram servers. By default, this file will be sent by the user with an optional caption. Alternatively, you can use _input_message_content_ to send a message with the specified content instead of the file.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the result, must be _document_ |\
| id  | String | Unique identifier for this result, 1-64 bytes |\
| title | String | Title for the result |\
| document_file_id | String | A valid file identifier for the file |\
| description | String | _Optional_. Short description of the result |\
| caption | String | _Optional_. Caption of the document to be sent, 0-1024 characters after entities parsing |\
| parse_mode | String | _Optional_. Mode for parsing entities in the document caption. See [formatting options](https://core.telegram.org/bots/api#formatting-options)<br> for more details. |\
| caption_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. List of special entities that appear in the caption, which can be specified instead of _parse_mode_ |\
| reply_markup | [InlineKeyboardMarkup](https://core.telegram.org/bots/api#inlinekeyboardmarkup) | _Optional_. [Inline keyboard](https://core.telegram.org/bots/features#inline-keyboards)<br> attached to the message |\
| input_message_content | [InputMessageContent](https://core.telegram.org/bots/api#inputmessagecontent) | _Optional_. Content of the message to be sent instead of the file |\
\
