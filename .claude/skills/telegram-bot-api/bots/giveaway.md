# giveaway

- **URL:** https://core.telegram.org/bots/api/available-types/giveaway
- **Summary:** This object represents a message about a scheduled giveaway. | chats | Array of Chat | The list of chats which the user must join to participate in the giveaway | | winners_selection_date | Integer | Point in time (Unix timestamp) when winners of the giveaway will be selected | | winner_count |...

# giveaway

Giveaway

This object represents a message about a scheduled giveaway.

| Field | Type | Description |
| --- | --- | --- |
| chats | Array of [Chat](https://core.telegram.org/bots/api#chat) | The list of chats which the user must join to participate in the giveaway |
| winners_selection_date | Integer | Point in time (Unix timestamp) when winners of the giveaway will be selected |
| winner_count | Integer | The number of users which are supposed to be selected as winners of the giveaway |
| only_new_members | True | _Optional_. _True_, if only users who join the chats after the giveaway started should be eligible to win |
| has_public_winners | True | _Optional_. _True_, if the list of giveaway winners will be visible to everyone |
| prize_description | String | _Optional_. Description of additional giveaway prize |
| country_codes | Array of String | _Optional_. A list of two-letter [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)<br> country codes indicating the countries from which eligible users for the giveaway must come. If empty, then all users can participate in the giveaway. Users with a phone number that was bought on Fragment can always participate in giveaways. |
| prize_star_count | Integer | _Optional_. The number of Telegram Stars to be split between giveaway winners; for Telegram Star giveaways only |
| premium_subscription_month_count | Integer | _Optional_. The number of months the Telegram Premium subscription won from the giveaway will be active for; for Telegram Premium giveaways only |
