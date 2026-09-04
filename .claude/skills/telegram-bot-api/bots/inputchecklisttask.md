# inputchecklisttask

- **URL:** https://core.telegram.org/bots/api/available-types/inputchecklisttask
- **Summary:** Describes a task to add to a checklist. | id  | Integer | Unique identifier of the task; must be positive and unique among all task identifiers currently present in the checklist | | text | String | Text of the task; 1-100 characters after entities parsing | | parse_mode | String | _Optional_.

# inputchecklisttask

InputChecklistTask

Describes a task to add to a checklist.

| Field | Type | Description |
| --- | --- | --- |
| id  | Integer | Unique identifier of the task; must be positive and unique among all task identifiers currently present in the checklist |
| text | String | Text of the task; 1-100 characters after entities parsing |
| parse_mode | String | _Optional_. Mode for parsing entities in the text. See [formatting options](https://core.telegram.org/bots/api#formatting-options)<br> for more details. |
| text_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. List of special entities that appear in the text, which can be specified instead of parse_mode. Currently, only _bold_, _italic_, _underline_, _strikethrough_, _spoiler_, _custom_emoji_, and _date_time_ entities are allowed. |
