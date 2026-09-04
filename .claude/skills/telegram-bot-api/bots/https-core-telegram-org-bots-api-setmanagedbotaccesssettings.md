# [](https://core.telegram.org/bots/api#setmanagedbotaccesssettings)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#setmanagedbotaccesssettings)\
- **Summary:** setManagedBotAccessSettings\ Use this method to change the access settings of a managed bot.

# \

setManagedBotAccessSettings\
\
Use this method to change the access settings of a managed bot. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| user_id | Integer | Yes | User identifier of the managed bot whose access settings will be changed |\
| is_access_restricted | Boolean | Yes | Pass _True_ if only selected users can access the bot. The bot's owner can always access it. |\
| added_user_ids | Array of Integer | Optional | A JSON-serialized list of up to 10 identifiers of users who will have access to the bot in addition to its owner. Ignored if _is_access_restricted_ is _False_. |\
\
