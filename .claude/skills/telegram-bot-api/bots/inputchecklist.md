# inputchecklist

- **URL:** https://core.telegram.org/bots/api/available-types/inputchecklist
- **Summary:** Describes a checklist to create. | title | String | Title of the checklist; 1-255 characters after entities parsing | | parse_mode | String | _Optional_.

# inputchecklist

InputChecklist

Describes a checklist to create.

| Field | Type | Description |
| --- | --- | --- |
| title | String | Title of the checklist; 1-255 characters after entities parsing |
| parse_mode | String | _Optional_. Mode for parsing entities in the title. See [formatting options](https://core.telegram.org/bots/api#formatting-options)<br> for more details. |
| title_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. List of special entities that appear in the title, which can be specified instead of parse_mode. Currently, only _bold_, _italic_, _underline_, _strikethrough_, _spoiler_, _custom_emoji_, and _date_time_ entities are allowed. |
| tasks | Array of [InputChecklistTask](https://core.telegram.org/bots/api#inputchecklisttask) | List of 1-30 tasks in the checklist |
| others_can_add_tasks | Boolean | _Optional_. Pass _True_ if other users can add tasks to the checklist |
| others_can_mark_tasks_as_done | Boolean | _Optional_. Pass _True_ if other users can mark tasks as done or not done in the checklist |
