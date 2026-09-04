# ownedgiftunique

- **URL:** https://core.telegram.org/bots/api/available-types/ownedgiftunique
- **Summary:** Describes a unique gift received and owned by a user or a chat. | type | String | Type of the gift, always “unique” | | gift | UniqueGift | Information about the unique gift | | owned_gift_id | String | _Optional_.

# ownedgiftunique

OwnedGiftUnique

Describes a unique gift received and owned by a user or a chat.

| Field | Type | Description |
| --- | --- | --- |
| type | String | Type of the gift, always “unique” |
| gift | [UniqueGift](https://core.telegram.org/bots/api#uniquegift) | Information about the unique gift |
| owned_gift_id | String | _Optional_. Unique identifier of the received gift for the bot; for gifts received on behalf of business accounts only |
| sender_user | [User](https://core.telegram.org/bots/api#user) | _Optional_. Sender of the gift if it is a known user |
| send_date | Integer | Date the gift was sent in Unix time |
| is_saved | True | _Optional_. _True_, if the gift is displayed on the account's profile page; for gifts received on behalf of business accounts only |
| can_be_transferred | True | _Optional_. _True_, if the gift can be transferred to another owner; for gifts received on behalf of business accounts only |
| transfer_star_count | Integer | _Optional_. Number of Telegram Stars that must be paid to transfer the gift; omitted if the bot cannot transfer the gift |
| next_transfer_date | Integer | _Optional_. Point in time (Unix timestamp) when the gift can be transferred. If it is in the past, then the gift can be transferred now. |
