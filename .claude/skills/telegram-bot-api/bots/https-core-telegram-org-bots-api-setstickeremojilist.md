# [](https://core.telegram.org/bots/api#setstickeremojilist)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#stickers)\/[](https://core.telegram.org/bots/api#setstickeremojilist)\
- **Summary:** setStickerEmojiList\ Use this method to change the list of emoji assigned to a regular or custom emoji sticker.

# \

setStickerEmojiList\
\
Use this method to change the list of emoji assigned to a regular or custom emoji sticker. The sticker must belong to a sticker set created by the bot. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| sticker | String | Yes | File identifier of the sticker |\
| emoji_list | Array of String | Yes | A JSON-serialized list of 1-20 emoji associated with the sticker |\
\
