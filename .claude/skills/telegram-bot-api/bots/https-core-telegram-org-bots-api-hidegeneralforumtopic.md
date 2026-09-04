# [](https://core.telegram.org/bots/api#hidegeneralforumtopic)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#hidegeneralforumtopic)\
- **Summary:** hideGeneralForumTopic\ Use this method to hide the 'General' topic in a forum supergroup chat.

# \

hideGeneralForumTopic\
\
Use this method to hide the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the _can_manage_topics_ administrator rights. The topic will be automatically closed if it was open. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target supergroup in the format `@username` |\
\
