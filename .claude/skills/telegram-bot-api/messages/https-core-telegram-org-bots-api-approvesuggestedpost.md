# [](https://core.telegram.org/bots/api#approvesuggestedpost)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#updating-messages)\/[](https://core.telegram.org/bots/api#approvesuggestedpost)\
- **Summary:** approveSuggestedPost\ Use this method to approve a suggested post in a direct messages chat.

# \

approveSuggestedPost\
\
Use this method to approve a suggested post in a direct messages chat. The bot must have the 'can_post_messages' administrator right in the corresponding channel chat. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| chat_id | Integer | Yes | Unique identifier for the target direct messages chat |\
| message_id | Integer | Yes | Identifier of a suggested post message to approve |\
| send_date | Integer | Optional | Point in time (Unix timestamp) when the post is expected to be published; omit if the date has already been specified when the suggested post was created. If specified, then the date must be not more than 2678400 seconds (30 days) in the future. |\
\
