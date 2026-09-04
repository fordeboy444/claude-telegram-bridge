# ownedgiftregular

- **URL:** https://core.telegram.org/bots/api/available-types/ownedgiftregular
- **Summary:** Describes a regular gift owned by a user or a chat. | type | String | Type of the gift, always “regular” | | gift | Gift | Information about the regular gift | | owned_gift_id | String | _Optional_.

# ownedgiftregular

OwnedGiftRegular

Describes a regular gift owned by a user or a chat.

| Field | Type | Description |
| --- | --- | --- |
| type | String | Type of the gift, always “regular” |
| gift | [Gift](https://core.telegram.org/bots/api#gift) | Information about the regular gift |
| owned_gift_id | String | _Optional_. Unique identifier of the gift for the bot; for gifts received on behalf of business accounts only |
| sender_user | [User](https://core.telegram.org/bots/api#user) | _Optional_. Sender of the gift if it is a known user |
| send_date | Integer | Date the gift was sent in Unix time |
| text | String | _Optional_. Text of the message that was added to the gift |
| entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. Special entities that appear in the text |
| is_private | True | _Optional_. _True_, if the sender and gift text are shown only to the gift receiver; otherwise, everyone will be able to see them |
| is_saved | True | _Optional_. _True_, if the gift is displayed on the account's profile page; for gifts received on behalf of business accounts only |
| can_be_upgraded | True | _Optional_. _True_, if the gift can be upgraded to a unique gift; for gifts received on behalf of business accounts only |
| was_refunded | True | _Optional_. _True_, if the gift was refunded and isn't available anymore |
| convert_star_count | Integer | _Optional_. Number of Telegram Stars that can be claimed by the receiver instead of the gift; omitted if the gift cannot be converted to Telegram Stars; for gifts received on behalf of business accounts only |
| prepaid_upgrade_star_count | Integer | _Optional_. Number of Telegram Stars that were paid for the ability to upgrade the gift |
| is_upgrade_separate | True | _Optional_. _True_, if the gift's upgrade was purchased after the gift was sent; for gifts received on behalf of business accounts only |
| unique_gift_number | Integer | _Optional_. Unique number reserved for this gift when upgraded. See the _number_ field in [UniqueGift](https://core.telegram.org/bots/api#uniquegift)<br>. |
