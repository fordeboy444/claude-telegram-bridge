# [](https://core.telegram.org/bots/api#richblockphoto)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#rich-messages)\/[](https://core.telegram.org/bots/api#richblockphoto)\
- **Summary:** A block with a photo, corresponding to the HTML tag `<img>`.\

# \

RichBlockPhoto\
\
A block with a photo, corresponding to the HTML tag `<img>`.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the block, always “photo” |\
| photo | Array of [PhotoSize](https://core.telegram.org/bots/api#photosize) | Available sizes of the photo |\
| has_spoiler | True | _Optional_. _True_, if the media preview is covered by a spoiler animation |\
| caption | [RichBlockCaption](https://core.telegram.org/bots/api#richblockcaption) | _Optional_. Caption of the block |\
\
