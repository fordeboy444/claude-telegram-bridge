# checklisttasksadded

- **URL:** https://core.telegram.org/bots/api/available-types/checklisttasksadded
- **Summary:** Describes a service message about tasks added to a checklist. | checklist_message | Message | _Optional_.

# checklisttasksadded

ChecklistTasksAdded

Describes a service message about tasks added to a checklist.

| Field | Type | Description |
| --- | --- | --- |
| checklist_message | [Message](https://core.telegram.org/bots/api#message) | _Optional_. Message containing the checklist to which the tasks were added. Note that the [Message](https://core.telegram.org/bots/api#message)<br> object in this field will not contain the _reply_to_message_ field even if it itself is a reply. |
| tasks | Array of [ChecklistTask](https://core.telegram.org/bots/api#checklisttask) | List of tasks added to the checklist |
