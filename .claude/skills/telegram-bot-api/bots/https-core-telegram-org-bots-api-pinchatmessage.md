# [](https://core.telegram.org/bots/api#pinchatmessage)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#pinchatmessage)\
- **Summary:** Use this method to add a message to the list of pinned messages in a chat.

# \

pinChatMessage\
\
Use this method to add a message to the list of pinned messages in a chat. In private chats and channel direct messages chats, all non-service messages can be pinned. Conversely, the bot must be an administrator with the 'can_pin_messages' right or the 'can_edit_messages' right to pin messages in groups and channels respectively. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| business_connection_id | String | Optional | Unique identifier of the business connection on behalf of which the message will be pinned |\
| chat_id | Integer or String | Yes | Unique identifier for the target chat or username of the target channel in the format `@username` |\
| message_id | Integer | Yes | Identifier of a message to pin |\
| disable_notification | Boolean | Optional | Pass _True_ if it is not necessary to send a notification to all chat members about the new pinned message. Notifications are always disabled in channels and private chats. |\
\
