# storyareatypesuggestedreaction

- **URL:** https://core.telegram.org/bots/api/available-types/storyareatypesuggestedreaction
- **Summary:** StoryAreaTypeSuggestedReaction Describes a story area pointing to a suggested reaction.

# storyareatypesuggestedreaction

StoryAreaTypeSuggestedReaction

Describes a story area pointing to a suggested reaction. Currently, a story can have up to 5 suggested reaction areas.

| Field | Type | Description |
| --- | --- | --- |
| type | String | Type of the area, always “suggested_reaction” |
| reaction_type | [ReactionType](https://core.telegram.org/bots/api#reactiontype) | Type of the reaction |
| is_dark | Boolean | _Optional_. Pass _True_ if the reaction area has a dark background |
| is_flipped | Boolean | _Optional_. Pass _True_ if reaction area corner is flipped |
