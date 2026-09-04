# inputmediaanimation

- **URL:** https://core.telegram.org/bots/api/available-types/inputmediaanimation
- **Summary:** Represents an animation file (GIF or H.264/MPEG-4 AVC video without sound) to be sent. | type | String | Type of the media, must be _animation_ | | caption | String | _Optional_.

# inputmediaanimation

InputMediaAnimation

Represents an animation file (GIF or H.264/MPEG-4 AVC video without sound) to be sent.

| Field | Type | Description |
| --- | --- | --- |
| type | String | Type of the media, must be _animation_ |
| media | String | File to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass “attach://<file_attach_name>” to upload a new one using multipart/form-data under <file_attach_name> name. [More information on Sending Files »](https://core.telegram.org/bots/api#sending-files) |
| thumbnail | String | _Optional_. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. [More information on Sending Files »](https://core.telegram.org/bots/api#sending-files) |
| caption | String | _Optional_. Caption of the animation to be sent, 0-1024 characters after entities parsing |
| parse_mode | String | _Optional_. Mode for parsing entities in the animation caption. See [formatting options](https://core.telegram.org/bots/api#formatting-options)<br> for more details. |
| caption_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. List of special entities that appear in the caption, which can be specified instead of _parse_mode_ |
| show_caption_above_media | Boolean | _Optional_. Pass _True_ if the caption must be shown above the message media |
| width | Integer | _Optional_. Animation width |
| height | Integer | _Optional_. Animation height |
| duration | Integer | _Optional_. Animation duration in seconds |
| has_spoiler | Boolean | _Optional_. Pass _True_ if the animation needs to be covered with a spoiler animation |
