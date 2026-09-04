# [](https://core.telegram.org/bots/api#setmydescription)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#setmydescription)\
- **Summary:** Use this method to change the bot's description, which is shown in the chat with the bot if the chat is empty.

# \

setMyDescription\
\
Use this method to change the bot's description, which is shown in the chat with the bot if the chat is empty. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| description | String | Optional | New bot description; 0-512 characters. Pass an empty string to remove the dedicated description for the given language. |\
| language_code | String | Optional | A two-letter ISO 639-1 language code. If empty, the description will be applied to all users for whose language there is no dedicated description. |\
\
