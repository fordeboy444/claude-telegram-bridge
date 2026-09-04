# giftinfo

- **URL:** https://core.telegram.org/bots/api/available-types/giftinfo
- **Summary:** Describes a service message about a regular gift that was sent or received. | gift | Gift | Information about the gift | | owned_gift_id | String | _Optional_.

# giftinfo

GiftInfo

Describes a service message about a regular gift that was sent or received.

| Field | Type | Description |
| --- | --- | --- |
| gift | [Gift](https://core.telegram.org/bots/api#gift) | Information about the gift |
| owned_gift_id | String | _Optional_. Unique identifier of the received gift for the bot; only present for gifts received on behalf of business accounts |
| convert_star_count | Integer | _Optional_. Number of Telegram Stars that can be claimed by the receiver by converting the gift; omitted if conversion to Telegram Stars is impossible |
| prepaid_upgrade_star_count | Integer | _Optional_. Number of Telegram Stars that were prepaid for the ability to upgrade the gift |
| is_upgrade_separate | True | _Optional_. _True_, if the gift's upgrade was purchased after the gift was sent |
| can_be_upgraded | True | _Optional_. _True_, if the gift can be upgraded to a unique gift |
| text | String | _Optional_. Text of the message that was added to the gift |
| entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. Special entities that appear in the text |
| is_private | True | _Optional_. _True_, if the sender and gift text are shown only to the gift receiver; otherwise, everyone will be able to see them |
| unique_gift_number | Integer | _Optional_. Unique number reserved for this gift when upgraded. See the _number_ field in [UniqueGift](https://core.telegram.org/bots/api#uniquegift)<br>. |
