# [](https://core.telegram.org/bots/api#inputrichmessage)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#rich-messages)\/[](https://core.telegram.org/bots/api#inputrichmessage)\
- **Summary:** Describes a rich message to be sent.

# \

InputRichMessage\
\
Describes a rich message to be sent. Exactly **one** of the fields _html_, _markdown_, or _blocks_ must be used.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| blocks | Array of [InputRichBlock](https://core.telegram.org/bots/api#inputrichblock) | _Optional_. Content of the rich message to send described as a list of blocks |\
| html | String | _Optional_. Content of the rich message to send described using HTML formatting. See [rich message formatting options](https://core.telegram.org/bots/api#rich-message-formatting-options)<br> for more details. Use _media_ field to specify the media used in the message. |\
| markdown | String | _Optional_. Content of the rich message to send described using Markdown formatting. See [rich message formatting options](https://core.telegram.org/bots/api#rich-message-formatting-options)<br> for more details. Use _media_ field to specify the media used in the message. |\
| media | Array of [InputRichMessageMedia](https://core.telegram.org/bots/api#inputrichmessagemedia) | _Optional_. List of media that are specified in the _markdown_ or _html_ fields using `tg://photo?id=`, `tg://video?id=`, `tg://document?id=`, and `tg://audio?id=` links |\
| is_rtl | Boolean | _Optional_. Pass _True_ if the rich message must be shown right-to-left |\
| skip_entity_detection | Boolean | _Optional_. Pass _True_ to skip automatic detection of entities (e.g., URLs, email addresses, username mentions, hashtags, cashtags, bot commands, or phone numbers) in the text |\
\
