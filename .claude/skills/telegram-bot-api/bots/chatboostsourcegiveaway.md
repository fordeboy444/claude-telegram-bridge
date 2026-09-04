# chatboostsourcegiveaway

- **URL:** https://core.telegram.org/bots/api/available-types/chatboostsourcegiveaway
- **Summary:** ChatBoostSourceGiveaway The boost was obtained by the creation of a Telegram Premium or a Telegram Star giveaway.

# chatboostsourcegiveaway

ChatBoostSourceGiveaway

The boost was obtained by the creation of a Telegram Premium or a Telegram Star giveaway. This boosts the chat 4 times for the duration of the corresponding Telegram Premium subscription for Telegram Premium giveaways and _prize_star_count_ / 500 times for one year for Telegram Star giveaways.

| Field | Type | Description |
| --- | --- | --- |
| source | String | Source of the boost, always “giveaway” |
| giveaway_message_id | Integer | Identifier of a message in the chat with the giveaway; the message could have been deleted already. May be 0 if the message isn't sent yet. |
| user | [User](https://core.telegram.org/bots/api#user) | _Optional_. User that won the prize in the giveaway if any; for Telegram Premium giveaways only |
| prize_star_count | Integer | _Optional_. The number of Telegram Stars to be split between giveaway winners; for Telegram Star giveaways only |
| is_unclaimed | True | _Optional_. _True_, if the giveaway was completed, but there was no user to win the prize |
