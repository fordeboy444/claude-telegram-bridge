# chatmemberbanned

- **URL:** https://core.telegram.org/bots/api/available-types/chatmemberbanned
- **Summary:** that was banned in the chat and can't return to the chat or view chat messages. | status | String | The member's status in the chat, always “kicked” | | until_date | Integer | Date when restrictions will be lifted for this user; Unix time.

# chatmemberbanned

ChatMemberBanned

Represents a [chat member](https://core.telegram.org/bots/api#chatmember)
 that was banned in the chat and can't return to the chat or view chat messages.

| Field | Type | Description |
| --- | --- | --- |
| status | String | The member's status in the chat, always “kicked” |
| user | [User](https://core.telegram.org/bots/api#user) | Information about the user |
| until_date | Integer | Date when restrictions will be lifted for this user; Unix time. If 0, then the user is banned forever. |
