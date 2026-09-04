# userrating

- **URL:** https://core.telegram.org/bots/api/available-types/userrating
- **Summary:** This object describes the rating of a user based on their Telegram Star spendings. | level | Integer | Current level of the user, indicating their reliability when purchasing digital goods and services.

# userrating

UserRating

This object describes the rating of a user based on their Telegram Star spendings.

| Field | Type | Description |
| --- | --- | --- |
| level | Integer | Current level of the user, indicating their reliability when purchasing digital goods and services. A higher level suggests a more trustworthy customer; a negative level is likely reason for concern. |
| rating | Integer | Numerical value of the user's rating; the higher the rating, the better |
| current_level_rating | Integer | The rating value required to get the current level |
| next_level_rating | Integer | _Optional_. The rating value required to get to the next level; omitted if the maximum level was reached |
