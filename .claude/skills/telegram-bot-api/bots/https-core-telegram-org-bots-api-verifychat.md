# [](https://core.telegram.org/bots/api#verifychat)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#verifychat)\
- **Summary:** Verifies a chat on behalf of the organization\ which is represented by the bot.

# \

verifyChat\
\
Verifies a chat [on behalf of the organization](https://telegram.org/verify#third-party-verification)\
 which is represented by the bot. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target bot, supergroup or channel in the format `@username`. Channel direct messages chats can't be verified. |\
| custom_description | String | Optional | Custom description for the verification; 0-70 characters. Must be empty if the organization isn't allowed to provide a custom verification description. |\
\
