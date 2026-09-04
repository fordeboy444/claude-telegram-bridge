# [](https://core.telegram.org/bots/api#inputrichmessagemedia)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#rich-messages)\/[](https://core.telegram.org/bots/api#inputrichmessagemedia)\
- **Summary:** InputRichMessageMedia\ Describes a media element embedded in an outgoing rich message.\ | id  | String | Unique identifier of the media used in a `tg://photo?id=`, `tg://video?id=`, `tg://document?id=`, or `tg://audio?id=` link. 1-64 characters, only `A-Z`, `a-z`, `0-9`, `_` and `-` are allowed. |\...

# \

InputRichMessageMedia\
\
Describes a media element embedded in an outgoing rich message.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| id  | String | Unique identifier of the media used in a `tg://photo?id=`, `tg://video?id=`, `tg://document?id=`, or `tg://audio?id=` link. 1-64 characters, only `A-Z`, `a-z`, `0-9`, `_` and `-` are allowed. |\
| media | [InputMediaAnimation](https://core.telegram.org/bots/api#inputmediaanimation)<br> or [InputMediaAudio](https://core.telegram.org/bots/api#inputmediaaudio)<br> or [InputMediaDocument](https://core.telegram.org/bots/api#inputmediadocument)<br> or [InputMediaPhoto](https://core.telegram.org/bots/api#inputmediaphoto)<br> or [InputMediaVideo](https://core.telegram.org/bots/api#inputmediavideo)<br> or [InputMediaVoiceNote](https://core.telegram.org/bots/api#inputmediavoicenote) | The media to be sent. Everything except the media itself and its properties is ignored. |\
\
