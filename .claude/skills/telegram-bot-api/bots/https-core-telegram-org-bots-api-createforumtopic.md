# [](https://core.telegram.org/bots/api#createforumtopic)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#createforumtopic)\
- **Summary:** Use this method to create a topic in a forum supergroup chat or a private chat with a user.

# \

createForumTopic\
\
Use this method to create a topic in a forum supergroup chat or a private chat with a user. In the case of a supergroup chat the bot must be an administrator in the chat for this to work and must have the _can_manage_topics_ administrator right. Returns information about the created topic as a [ForumTopic](https://core.telegram.org/bots/api#forumtopic)\
 object.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target supergroup in the format `@username` |\
| name | String | Yes | Topic name, 1-128 characters |\
| icon_color | Integer | Optional | Color of the topic icon in RGB format. Currently, must be one of 7322096 (0x6FB9F0), 16766590 (0xFFD67E), 13338331 (0xCB86DB), 9367192 (0x8EEE98), 16749490 (0xFF93B2), or 16478047 (0xFB6F5F). |\
| icon_custom_emoji_id | String | Optional | Unique identifier of the custom emoji shown as the topic icon. Use [getForumTopicIconStickers](https://core.telegram.org/bots/api#getforumtopiciconstickers)<br> to get all allowed custom emoji identifiers. |\
\
