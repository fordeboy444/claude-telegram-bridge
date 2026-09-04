# checklisttasksdone

- **URL:** https://core.telegram.org/bots/api/available-types/checklisttasksdone
- **Summary:** Describes a service message about checklist tasks marked as done or not done. | checklist_message | Message | _Optional_.

# checklisttasksdone

ChecklistTasksDone

Describes a service message about checklist tasks marked as done or not done.

| Field | Type | Description |
| --- | --- | --- |
| checklist_message | [Message](https://core.telegram.org/bots/api#message) | _Optional_. Message containing the checklist whose tasks were marked as done or not done. Note that the [Message](https://core.telegram.org/bots/api#message)<br> object in this field will not contain the _reply_to_message_ field even if it itself is a reply. |
| marked_as_done_task_ids | Array of Integer | _Optional_. Identifiers of the tasks that were marked as done |
| marked_as_not_done_task_ids | Array of Integer | _Optional_. Identifiers of the tasks that were marked as not done |
