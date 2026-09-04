# [](https://core.telegram.org/bots/api#setchatadministratorcustomtitle)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#setchatadministratorcustomtitle)\
- **Summary:** setChatAdministratorCustomTitle\ Use this method to set a custom title for an administrator in a supergroup promoted by the bot.

# \

setChatAdministratorCustomTitle\
\
Use this method to set a custom title for an administrator in a supergroup promoted by the bot. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target supergroup in the format `@username` |\
| user_id | Integer | Yes | Unique identifier of the target user |\
| custom_title | String | Yes | New custom title for the administrator; 0-16 characters, emoji are not allowed |\
\
