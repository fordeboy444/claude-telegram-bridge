# [](https://core.telegram.org/bots/api#inlinequeryresultphoto)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#inline-mode)\/[](https://core.telegram.org/bots/api#inlinequeryresultphoto)\
- **Summary:** InlineQueryResultPhoto\ Represents a link to a photo.

# \

InlineQueryResultPhoto\
\
Represents a link to a photo. By default, this photo will be sent by the user with optional caption. Alternatively, you can use _input_message_content_ to send a message with the specified content instead of the photo.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the result, must be _photo_ |\
| id  | String | Unique identifier for this result, 1-64 bytes |\
| photo_url | String | A valid URL of the photo. Photo must be in **JPEG** format. Photo size must not exceed 5MB. |\
| thumbnail_url | String | URL of the thumbnail for the photo |\
| photo_width | Integer | _Optional_. Width of the photo |\
| photo_height | Integer | _Optional_. Height of the photo |\
| title | String | _Optional_. Title for the result |\
| description | String | _Optional_. Short description of the result |\
| caption | String | _Optional_. Caption of the photo to be sent, 0-1024 characters after entities parsing |\
| parse_mode | String | _Optional_. Mode for parsing entities in the photo caption. See [formatting options](https://core.telegram.org/bots/api#formatting-options)<br> for more details. |\
| caption_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. List of special entities that appear in the caption, which can be specified instead of _parse_mode_ |\
| show_caption_above_media | Boolean | _Optional_. Pass _True_ if the caption must be shown above the message media |\
| reply_markup | [InlineKeyboardMarkup](https://core.telegram.org/bots/api#inlinekeyboardmarkup) | _Optional_. [Inline keyboard](https://core.telegram.org/bots/features#inline-keyboards)<br> attached to the message |\
| input_message_content | [InputMessageContent](https://core.telegram.org/bots/api#inputmessagecontent) | _Optional_. Content of the message to be sent instead of the photo |\
\
