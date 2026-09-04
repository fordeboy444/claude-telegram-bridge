# [](https://core.telegram.org/bots/api#sticker)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#stickers)\/[](https://core.telegram.org/bots/api#sticker)\
- **Summary:** This object represents a sticker.\ | file_id | String | Identifier for this file, which can be used to download or reuse the file |\ | file_unique_id | String | Unique identifier for this file, which is supposed to be the same over time and for different bots.

# \

Sticker\
\
This object represents a sticker.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| file_id | String | Identifier for this file, which can be used to download or reuse the file |\
| file_unique_id | String | Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. |\
| type | String | Type of the sticker, currently one of “regular”, “mask”, “custom_emoji”. The type of the sticker is independent from its format, which is determined by the fields _is_animated_ and _is_video_. |\
| width | Integer | Sticker width |\
| height | Integer | Sticker height |\
| is_animated | Boolean | _True_, if the sticker is [animated](https://telegram.org/blog/animated-stickers) |\
| is_video | Boolean | _True_, if the sticker is a [video sticker](https://telegram.org/blog/video-stickers-better-reactions) |\
| thumbnail | [PhotoSize](https://core.telegram.org/bots/api#photosize) | _Optional_. Sticker thumbnail in the .WEBP or .JPG format |\
| emoji | String | _Optional_. Emoji associated with the sticker |\
| set_name | String | _Optional_. Name of the sticker set to which the sticker belongs |\
| premium_animation | [File](https://core.telegram.org/bots/api#file) | _Optional_. For premium regular stickers, premium animation for the sticker |\
| mask_position | [MaskPosition](https://core.telegram.org/bots/api#maskposition) | _Optional_. For mask stickers, the position where the mask should be placed |\
| custom_emoji_id | String | _Optional_. For custom emoji stickers, unique identifier of the custom emoji |\
| needs_repainting | True | _Optional_. _True_, if the sticker must be repainted to a text color in messages, the color of the Telegram Premium badge in emoji status, white color on chat photos, or another appropriate color in other places |\
| file_size | Integer | _Optional_. File size in bytes |\
\
