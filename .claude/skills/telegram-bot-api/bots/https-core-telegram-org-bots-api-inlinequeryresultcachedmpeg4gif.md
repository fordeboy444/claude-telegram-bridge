# [](https://core.telegram.org/bots/api#inlinequeryresultcachedmpeg4gif)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#inline-mode)\/[](https://core.telegram.org/bots/api#inlinequeryresultcachedmpeg4gif)\
- **Summary:** InlineQueryResultCachedMpeg4Gif\ Represents a link to a video animation (H.264/MPEG-4 AVC video without sound) stored on the Telegram servers.

# \

InlineQueryResultCachedMpeg4Gif\
\
Represents a link to a video animation (H.264/MPEG-4 AVC video without sound) stored on the Telegram servers. By default, this animated MPEG-4 file will be sent by the user with an optional caption. Alternatively, you can use _input_message_content_ to send a message with the specified content instead of the animation.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the result, must be _mpeg4_gif_ |\
| id  | String | Unique identifier for this result, 1-64 bytes |\
| mpeg4_file_id | String | A valid file identifier for the MPEG4 file |\
| title | String | _Optional_. Title for the result |\
| caption | String | _Optional_. Caption of the MPEG-4 file to be sent, 0-1024 characters after entities parsing |\
| parse_mode | String | _Optional_. Mode for parsing entities in the caption. See [formatting options](https://core.telegram.org/bots/api#formatting-options)<br> for more details. |\
| caption_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. List of special entities that appear in the caption, which can be specified instead of _parse_mode_ |\
| show_caption_above_media | Boolean | _Optional_. Pass _True_ if the caption must be shown above the message media |\
| reply_markup | [InlineKeyboardMarkup](https://core.telegram.org/bots/api#inlinekeyboardmarkup) | _Optional_. [Inline keyboard](https://core.telegram.org/bots/features#inline-keyboards)<br> attached to the message |\
| input_message_content | [InputMessageContent](https://core.telegram.org/bots/api#inputmessagecontent) | _Optional_. Content of the message to be sent instead of the video animation |\
\
