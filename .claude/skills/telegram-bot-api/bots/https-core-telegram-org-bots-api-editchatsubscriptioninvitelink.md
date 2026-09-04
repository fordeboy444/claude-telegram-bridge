# [](https://core.telegram.org/bots/api#editchatsubscriptioninvitelink)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#editchatsubscriptioninvitelink)\
- **Summary:** editChatSubscriptionInviteLink\ Use this method to edit a subscription invite link created by the bot.

# \

editChatSubscriptionInviteLink\
\
Use this method to edit a subscription invite link created by the bot. The bot must have the _can_invite_users_ administrator rights. Returns the edited invite link as a [ChatInviteLink](https://core.telegram.org/bots/api#chatinvitelink)\
 object.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target channel in the format `@username` |\
| invite_link | String | Yes | The invite link to edit |\
| name | String | Optional | Invite link name; 0-32 characters |\
\
