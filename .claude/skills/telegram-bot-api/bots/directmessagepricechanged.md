# directmessagepricechanged

- **URL:** https://core.telegram.org/bots/api/available-types/directmessagepricechanged
- **Summary:** DirectMessagePriceChanged Describes a service message about a change in the price of direct messages sent to a channel chat. | are_direct_messages_enabled | Boolean | _True_, if direct messages are enabled for the channel chat; _False_ otherwise | | direct_message_star_count | Integer | _Optional_.

# directmessagepricechanged

DirectMessagePriceChanged

Describes a service message about a change in the price of direct messages sent to a channel chat.

| Field | Type | Description |
| --- | --- | --- |
| are_direct_messages_enabled | Boolean | _True_, if direct messages are enabled for the channel chat; _False_ otherwise |
| direct_message_star_count | Integer | _Optional_. The new number of Telegram Stars that must be paid by users for each direct message sent to the channel. Does not apply to users who have been exempted by administrators. Defaults to 0. |
