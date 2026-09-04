# [](https://core.telegram.org/bots/api#inlinequeryresultarticle)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#inline-mode)\/[](https://core.telegram.org/bots/api#inlinequeryresultarticle)\
- **Summary:** InlineQueryResultArticle\ Represents a link to an article or web page.\ | type | String | Type of the result, must be _article_ |\ | title | String | Title of the result |\ | input_message_content | InputMessageContent | Content of the message to be sent |\ | url | String | _Optional_.

# \

InlineQueryResultArticle\
\
Represents a link to an article or web page.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the result, must be _article_ |\
| id  | String | Unique identifier for this result, 1-64 Bytes |\
| title | String | Title of the result |\
| input_message_content | [InputMessageContent](https://core.telegram.org/bots/api#inputmessagecontent) | Content of the message to be sent |\
| reply_markup | [InlineKeyboardMarkup](https://core.telegram.org/bots/api#inlinekeyboardmarkup) | _Optional_. [Inline keyboard](https://core.telegram.org/bots/features#inline-keyboards)<br> attached to the message |\
| url | String | _Optional_. URL of the result |\
| description | String | _Optional_. Short description of the result |\
| thumbnail_url | String | _Optional_. Url of the thumbnail for the result |\
| thumbnail_width | Integer | _Optional_. Thumbnail width |\
| thumbnail_height | Integer | _Optional_. Thumbnail height |\
\
