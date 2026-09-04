# chatmemberupdated

- **URL:** https://core.telegram.org/bots/api/available-types/chatmemberupdated
- **Summary:** This object represents changes in the status of a chat member. | chat | Chat | Chat the user belongs to | | from | User | Performer of the action, which resulted in the change | | date | Integer | Date the change was done in Unix time | | old_chat_member | ChatMember | Previous information about...

# chatmemberupdated

ChatMemberUpdated

This object represents changes in the status of a chat member.

| Field | Type | Description |
| --- | --- | --- |
| chat | [Chat](https://core.telegram.org/bots/api#chat) | Chat the user belongs to |
| from | [User](https://core.telegram.org/bots/api#user) | Performer of the action, which resulted in the change |
| date | Integer | Date the change was done in Unix time |
| old_chat_member | [ChatMember](https://core.telegram.org/bots/api#chatmember) | Previous information about the chat member |
| new_chat_member | [ChatMember](https://core.telegram.org/bots/api#chatmember) | New information about the chat member |
| invite_link | [ChatInviteLink](https://core.telegram.org/bots/api#chatinvitelink) | _Optional_. Chat invite link, which was used by the user to join the chat; for joining by invite link events only |
| via_join_request | Boolean | _Optional_. _True_, if the user joined the chat after sending a direct join request without using an invite link and being approved by an administrator |
| via_chat_folder_invite_link | Boolean | _Optional_. _True_, if the user joined the chat via a chat folder invite link |
