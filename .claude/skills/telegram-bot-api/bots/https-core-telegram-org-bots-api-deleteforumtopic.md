# [](https://core.telegram.org/bots/api#deleteforumtopic)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#deleteforumtopic)\
- **Summary:** Use this method to delete a forum topic along with all its messages in a forum supergroup chat or a private chat with a user.

# \

deleteForumTopic\
\
Use this method to delete a forum topic along with all its messages in a forum supergroup chat or a private chat with a user. In the case of a supergroup chat the bot must be an administrator in the chat for this to work and must have the _can_delete_messages_ administrator rights. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target supergroup in the format `@username` |\
| message_thread_id | Integer | Yes | Unique identifier for the target message thread of the forum topic |\
\
