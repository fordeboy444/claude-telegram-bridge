# giveawaycompleted

- **URL:** https://core.telegram.org/bots/api/available-types/giveawaycompleted
- **Summary:** This object represents a service message about the completion of a giveaway without public winners. | winner_count | Integer | Number of winners in the giveaway | | unclaimed_prize_count | Integer | _Optional_.

# giveawaycompleted

GiveawayCompleted

This object represents a service message about the completion of a giveaway without public winners.

| Field | Type | Description |
| --- | --- | --- |
| winner_count | Integer | Number of winners in the giveaway |
| unclaimed_prize_count | Integer | _Optional_. Number of undistributed prizes |
| giveaway_message | [Message](https://core.telegram.org/bots/api#message) | _Optional_. Message with the giveaway that was completed, if it wasn't deleted |
| is_star_giveaway | True | _Optional_. _True_, if the giveaway is a Telegram Star giveaway. Otherwise, currently, the giveaway is a Telegram Premium giveaway. |
