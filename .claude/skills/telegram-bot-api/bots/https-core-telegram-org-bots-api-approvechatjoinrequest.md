# [](https://core.telegram.org/bots/api#approvechatjoinrequest)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#approvechatjoinrequest)\
- **Summary:** approveChatJoinRequest\ Use this method to approve a chat join request.

# \

approveChatJoinRequest\
\
Use this method to approve a chat join request. The bot must be an administrator in the chat for this to work and must have the _can_invite_users_ administrator right. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target channel in the format `@username` |\
| user_id | Integer | Yes | Unique identifier of the target user |\
\
