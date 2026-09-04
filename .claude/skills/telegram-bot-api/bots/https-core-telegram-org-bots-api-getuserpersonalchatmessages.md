# [](https://core.telegram.org/bots/api#getuserpersonalchatmessages)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#getuserpersonalchatmessages)\
- **Summary:** getUserPersonalChatMessages\ Use this method to get the last messages from the personal chat (i.e., the chat currently added to their profile) of a given user.

# \

getUserPersonalChatMessages\
\
Use this method to get the last messages from the personal chat (i.e., the chat currently added to their profile) of a given user. On success, an Array of [Message](https://core.telegram.org/bots/api#message)\
 objects is returned.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| user_id | Integer | Yes | Unique identifier for the target user |\
| limit | Integer | Yes | The maximum number of messages to return; 1-20 |\
\
