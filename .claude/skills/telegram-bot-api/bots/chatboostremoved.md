# chatboostremoved

- **URL:** https://core.telegram.org/bots/api/available-types/chatboostremoved
- **Summary:** This object represents a boost removed from a chat.

# chatboostremoved

ChatBoostRemoved

This object represents a boost removed from a chat.

| Field | Type | Description |
| --- | --- | --- |
| chat | [Chat](https://core.telegram.org/bots/api#chat) | Chat which was boosted |
| boost_id | String | Unique identifier of the boost |
| remove_date | Integer | Point in time (Unix timestamp) when the boost was removed |
| source | [ChatBoostSource](https://core.telegram.org/bots/api#chatboostsource) | Source of the removed boost |
