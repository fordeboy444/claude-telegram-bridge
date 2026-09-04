# [](https://core.telegram.org/bots/api#inlinequeryresultdocument)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#inline-mode)\/[](https://core.telegram.org/bots/api#inlinequeryresultdocument)\
- **Summary:** InlineQueryResultDocument\ Represents a link to a file.

# \

InlineQueryResultDocument\
\
Represents a link to a file. By default, this file will be sent by the user with an optional caption. Alternatively, you can use _input_message_content_ to send a message with the specified content instead of the file. Currently, only **.PDF** and **.ZIP** files can be sent using this method.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the result, must be _document_ |\
| id  | String | Unique identifier for this result, 1-64 bytes |\
| title | String | Title for the result |\
| caption | String | _Optional_. Caption of the document to be sent, 0-1024 characters after entities parsing |\
| parse_mode | String | _Optional_. Mode for parsing entities in the document caption. See [formatting options](https://core.telegram.org/bots/api#formatting-options)<br> for more details. |\
| caption_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. List of special entities that appear in the caption, which can be specified instead of _parse_mode_ |\
| document_url | String | A valid URL for the file |\
| mime_type | String | MIME type of the content of the file, either “application/pdf” or “application/zip” |\
| description | String | _Optional_. Short description of the result |\
| reply_markup | [InlineKeyboardMarkup](https://core.telegram.org/bots/api#inlinekeyboardmarkup) | _Optional_. [Inline keyboard](https://core.telegram.org/bots/features#inline-keyboards)<br> attached to the message |\
| input_message_content | [InputMessageContent](https://core.telegram.org/bots/api#inputmessagecontent) | _Optional_. Content of the message to be sent instead of the file |\
| thumbnail_url | String | _Optional_. URL of the thumbnail (JPEG only) for the file |\
| thumbnail_width | Integer | _Optional_. Thumbnail width |\
| thumbnail_height | Integer | _Optional_. Thumbnail height |\
\
