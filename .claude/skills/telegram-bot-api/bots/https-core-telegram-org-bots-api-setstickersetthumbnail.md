# [](https://core.telegram.org/bots/api#setstickersetthumbnail)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#stickers)\/[](https://core.telegram.org/bots/api#setstickersetthumbnail)\
- **Summary:** setStickerSetThumbnail\ Use this method to set the thumbnail of a regular or mask sticker set.

# \

setStickerSetThumbnail\
\
Use this method to set the thumbnail of a regular or mask sticker set. The format of the thumbnail file must match the format of the stickers in the set. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| name | String | Yes | Sticker set name |\
| user_id | Integer | Yes | User identifier of the sticker set owner |\
| thumbnail | [InputFile](https://core.telegram.org/bots/api#inputfile)<br> or String | Optional | A **.WEBP** or **.PNG** image with the thumbnail, must be up to 128 kilobytes in size and have a width and height of exactly 100px, or a **.TGS** animation with a thumbnail up to 32 kilobytes in size (see <br>[https://core.telegram.org/stickers#animation-requirements](https://core.telegram.org/stickers#animation-requirements)<br> for animated sticker technical requirements), or a **.WEBM** video with the thumbnail up to 32 kilobytes in size; see <br>[https://core.telegram.org/stickers#video-requirements](https://core.telegram.org/stickers#video-requirements)<br> for video sticker technical requirements. Pass a _file_id_ as a String to send a file that already exists on the Telegram servers, pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data. [More information on Sending Files »](https://core.telegram.org/bots/api#sending-files)<br>. Animated and video sticker set thumbnails can't be uploaded via HTTP URL. If omitted, then the thumbnail is dropped and the first sticker is used as the thumbnail. |\
| format | String | Yes | Format of the thumbnail, must be one of “static” for a **.WEBP** or **.PNG** image, “animated” for a **.TGS** animation, or “video” for a **.WEBM** video |\
\
