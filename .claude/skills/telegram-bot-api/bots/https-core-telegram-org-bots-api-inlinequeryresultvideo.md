# [](https://core.telegram.org/bots/api#inlinequeryresultvideo)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#inline-mode)\/[](https://core.telegram.org/bots/api#inlinequeryresultvideo)\
- **Summary:** InlineQueryResultVideo\ Represents a link to a page containing an embedded video player or a video file.

# \

InlineQueryResultVideo\
\
Represents a link to a page containing an embedded video player or a video file. By default, this video file will be sent by the user with an optional caption. Alternatively, you can use _input_message_content_ to send a message with the specified content instead of the video.\
\
> If an InlineQueryResultVideo message contains an embedded video (e.g., YouTube), you **must** replace its content using _input_message_content_.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the result, must be _video_ |\
| id  | String | Unique identifier for this result, 1-64 bytes |\
| video_url | String | A valid URL for the embedded video player or video file |\
| mime_type | String | MIME type of the content of the video URL, “text/html” or “video/mp4” |\
| thumbnail_url | String | URL of the thumbnail (JPEG only) for the video |\
| title | String | Title for the result |\
| caption | String | _Optional_. Caption of the video to be sent, 0-1024 characters after entities parsing |\
| parse_mode | String | _Optional_. Mode for parsing entities in the video caption. See [formatting options](https://core.telegram.org/bots/api#formatting-options)<br> for more details. |\
| caption_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. List of special entities that appear in the caption, which can be specified instead of _parse_mode_ |\
| show_caption_above_media | Boolean | _Optional_. Pass _True_ if the caption must be shown above the message media |\
| video_width | Integer | _Optional_. Video width |\
| video_height | Integer | _Optional_. Video height |\
| video_duration | Integer | _Optional_. Video duration in seconds |\
| description | String | _Optional_. Short description of the result |\
| reply_markup | [InlineKeyboardMarkup](https://core.telegram.org/bots/api#inlinekeyboardmarkup) | _Optional_. [Inline keyboard](https://core.telegram.org/bots/features#inline-keyboards)<br> attached to the message |\
| input_message_content | [InputMessageContent](https://core.telegram.org/bots/api#inputmessagecontent) | _Optional_. Content of the message to be sent instead of the video. This field is **required** if InlineQueryResultVideo is used to send an HTML-page as a result (e.g., a YouTube video). |\
\
