# [](https://core.telegram.org/bots/api#banchatmember)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#banchatmember)\
- **Summary:** Use this method to ban a user in a group, a supergroup or a channel.

# \

banChatMember\
\
Use this method to ban a user in a group, a supergroup or a channel. In the case of supergroups and channels, the user will not be able to return to the chat on their own using invite links, etc., unless [unbanned](https://core.telegram.org/bots/api#unbanchatmember)\
 first. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target group or username of the target supergroup or channel in the format `@username` |\
| user_id | Integer | Yes | Unique identifier of the target user |\
| until_date | Integer | Optional | Date when the user will be unbanned; Unix time. If user is banned for more than 366 days or less than 30 seconds from the current time they are considered to be banned forever. Applied for supergroups and channels only. |\
| revoke_messages | Boolean | Optional | Pass _True_ to delete all messages from the chat for the user that is being removed. If _False_, the user will be able to see messages in the group that were sent before the user was removed. Always _True_ for supergroups and channels. |\
\
