# [](https://core.telegram.org/bots/api#declinesuggestedpost)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#updating-messages)\/[](https://core.telegram.org/bots/api#declinesuggestedpost)\
- **Summary:** declineSuggestedPost\ Use this method to decline a suggested post in a direct messages chat.

# \

declineSuggestedPost\
\
Use this method to decline a suggested post in a direct messages chat. The bot must have the 'can_manage_direct_messages' administrator right in the corresponding channel chat. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer | Yes | Unique identifier for the target direct messages chat |\
| message_id | Integer | Yes | Identifier of a suggested post message to decline |\
| comment | String | Optional | Comment for the creator of the suggested post; 0-128 characters |\
\
