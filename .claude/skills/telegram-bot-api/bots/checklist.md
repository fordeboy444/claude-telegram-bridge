# checklist

- **URL:** https://core.telegram.org/bots/api/available-types/checklist
- **Summary:** Describes a checklist. | title | String | Title of the checklist | | title_entities | Array of MessageEntity | _Optional_.

# checklist

Checklist

Describes a checklist.

| Field | Type | Description |
| --- | --- | --- |
| title | String | Title of the checklist |
| title_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. Special entities that appear in the checklist title |
| tasks | Array of [ChecklistTask](https://core.telegram.org/bots/api#checklisttask) | List of tasks in the checklist |
| others_can_add_tasks | True | _Optional_. _True_, if users other than the creator of the list can add tasks to the list |
| others_can_mark_tasks_as_done | True | _Optional_. _True_, if users other than the creator of the list can mark tasks as done or not done |
