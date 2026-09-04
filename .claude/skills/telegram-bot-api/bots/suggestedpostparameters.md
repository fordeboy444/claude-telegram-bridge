# suggestedpostparameters

- **URL:** https://core.telegram.org/bots/api/available-types/suggestedpostparameters
- **Summary:** SuggestedPostParameters Contains parameters of a post that is being suggested by the bot. | price | SuggestedPostPrice | _Optional_.

# suggestedpostparameters

SuggestedPostParameters

Contains parameters of a post that is being suggested by the bot.

| Field | Type | Description |
| --- | --- | --- |
| price | [SuggestedPostPrice](https://core.telegram.org/bots/api#suggestedpostprice) | _Optional_. Proposed price for the post. If the field is omitted, then the post is unpaid. |
| send_date | Integer | _Optional_. Proposed send date of the post. If specified, then the date must be between 300 second and 2678400 seconds (30 days) in the future. If the field is omitted, then the post can be published at any time within 30 days at the sole discretion of the user who approves it. |
