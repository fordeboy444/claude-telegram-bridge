# [](https://core.telegram.org/bots/api#deletechatstickerset)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#deletechatstickerset)\
- **Summary:** deleteChatStickerSet\ Use this method to delete a group sticker set from a supergroup.

# \

deleteChatStickerSet\
\
Use this method to delete a group sticker set from a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Use the field _can_set_sticker_set_ optionally returned in [getChat](https://core.telegram.org/bots/api#getchat)\
 requests to check if the bot can use this method. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target supergroup in the format `@username` |\
\
