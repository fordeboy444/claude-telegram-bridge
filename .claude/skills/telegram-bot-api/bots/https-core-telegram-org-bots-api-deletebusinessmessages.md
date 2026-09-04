# [](https://core.telegram.org/bots/api#deletebusinessmessages)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#deletebusinessmessages)\
- **Summary:** deleteBusinessMessages\ Delete messages on behalf of a business account.

# \

deleteBusinessMessages\
\
Delete messages on behalf of a business account. Requires the _can_delete_sent_messages_ business bot right to delete messages sent by the bot itself, or the _can_delete_all_messages_ business bot right to delete any message. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| business_connection_id | String | Yes | Unique identifier of the business connection on behalf of which to delete the messages |\
| message_ids | Array of Integer | Yes | A JSON-serialized list of 1-100 identifiers of messages to delete. All messages must be from the same chat. See [deleteMessage](https://core.telegram.org/bots/api#deletemessage)<br> for limitations on which messages can be deleted. |\
\
