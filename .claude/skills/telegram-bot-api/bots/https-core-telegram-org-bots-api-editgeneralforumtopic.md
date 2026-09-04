# [](https://core.telegram.org/bots/api#editgeneralforumtopic)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#editgeneralforumtopic)\
- **Summary:** editGeneralForumTopic\ Use this method to edit the name of the 'General' topic in a forum supergroup chat.

# \

editGeneralForumTopic\
\
Use this method to edit the name of the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the _can_manage_topics_ administrator rights. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target supergroup in the format `@username` |\
| name | String | Yes | New topic name, 1-128 characters |\
\
