# [](https://core.telegram.org/bots/api#getchatadministrators)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#getchatadministrators)\
- **Summary:** getChatAdministrators\ Use this method to get a list of administrators in a chat.

# \

getChatAdministrators\
\
Use this method to get a list of administrators in a chat. Returns an Array of [ChatMember](https://core.telegram.org/bots/api#chatmember)\
 objects.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target supergroup or channel in the format `@username` |\
| return_bots | Boolean | Optional | Pass _True_ to additionally receive all bots that are administrators of the chat. By default, bots other than the current bot are omitted. |\
\
