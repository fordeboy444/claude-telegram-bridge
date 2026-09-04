# [](https://core.telegram.org/bots/api#deletestory)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#deletestory)\
- **Summary:** Deletes a story previously posted by the bot on behalf of a managed business account.

# \

deleteStory\
\
Deletes a story previously posted by the bot on behalf of a managed business account. Requires the _can_manage_stories_ business bot right. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| business_connection_id | String | Yes | Unique identifier of the business connection |\
| story_id | Integer | Yes | Unique identifier of the story to delete |\
\
