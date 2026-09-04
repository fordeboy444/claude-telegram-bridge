# [](https://core.telegram.org/bots/api#setmyshortdescription)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#setmyshortdescription)\
- **Summary:** setMyShortDescription\ Use this method to change the bot's short description, which is shown on the bot's profile page and is sent together with the link when users share the bot.

# \

setMyShortDescription\
\
Use this method to change the bot's short description, which is shown on the bot's profile page and is sent together with the link when users share the bot. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| short_description | String | Optional | New short description for the bot; 0-120 characters. Pass an empty string to remove the dedicated short description for the given language. |\
| language_code | String | Optional | A two-letter ISO 639-1 language code. If empty, the short description will be applied to all users for whose language there is no dedicated short description. |\
\
