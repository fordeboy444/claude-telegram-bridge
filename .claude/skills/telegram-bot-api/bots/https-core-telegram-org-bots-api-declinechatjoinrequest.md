# [](https://core.telegram.org/bots/api#declinechatjoinrequest)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#declinechatjoinrequest)\
- **Summary:** declineChatJoinRequest\ Use this method to decline a chat join request.

# \

declineChatJoinRequest\
\
Use this method to decline a chat join request. The bot must be an administrator in the chat for this to work and must have the _can_invite_users_ administrator right. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target channel in the format `@username` |\
| user_id | Integer | Yes | Unique identifier of the target user |\
\
