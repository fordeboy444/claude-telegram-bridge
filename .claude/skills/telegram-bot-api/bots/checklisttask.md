# checklisttask

- **URL:** https://core.telegram.org/bots/api/available-types/checklisttask
- **Summary:** Describes a task in a checklist. | id  | Integer | Unique identifier of the task | | text | String | Text of the task | | text_entities | Array of MessageEntity | _Optional_.

# checklisttask

ChecklistTask

Describes a task in a checklist.

| Field | Type | Description |
| --- | --- | --- |
| id  | Integer | Unique identifier of the task |
| text | String | Text of the task |
| text_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. Special entities that appear in the task text |
| completed_by_user | [User](https://core.telegram.org/bots/api#user) | _Optional_. User that completed the task; omitted if the task wasn't completed by a user |
| completed_by_chat | [Chat](https://core.telegram.org/bots/api#chat) | _Optional_. Chat that completed the task; omitted if the task wasn't completed by a chat |
| completion_date | Integer | _Optional_. Point in time (Unix timestamp) when the task was completed; 0 if the task wasn't completed |
