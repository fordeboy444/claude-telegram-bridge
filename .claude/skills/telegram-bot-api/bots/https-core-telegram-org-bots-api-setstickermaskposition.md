# [](https://core.telegram.org/bots/api#setstickermaskposition)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#stickers)\/[](https://core.telegram.org/bots/api#setstickermaskposition)\
- **Summary:** setStickerMaskPosition\ Use this method to change the mask position\ of a mask sticker.

# \

setStickerMaskPosition\
\
Use this method to change the [mask position](https://core.telegram.org/bots/api#maskposition)\
 of a mask sticker. The sticker must belong to a sticker set that was created by the bot. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| sticker | String | Yes | File identifier of the sticker |\
| mask_position | [MaskPosition](https://core.telegram.org/bots/api#maskposition) | Optional | A JSON-serialized object with the position where the mask should be placed on faces. Omit the parameter to remove the mask position. |\
\
