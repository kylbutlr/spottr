# Spottr Domain Context

Spottr organizes lightweight frontend QA evidence into durable projects and bounded QA sessions so notes can be captured quickly and handed to an agent without losing context.

## Language

**Project**:
A durable workstream that groups related frontend QA work. A Project may remain available when it has no Notes.

**QA session**:
A bounded batch of QA work within a Project. A QA session is also the boundary used when reviewing or exporting Notes.
_Avoid_: Run, batch

**Note**:
One saved human QA observation, including its message, optional screenshot, page context, and capture metadata.

**Text-only note**:
A Note intentionally captured without a screenshot when the observation is faster to describe than to illustrate.

**Note draft**:
An unsaved observation whose captured screenshot remains available while its message and assignment are confirmed.

**Note assignment**:
The Project and QA session that will own a Note when it is saved. Changing the assignment does not discard the Note draft or its screenshot.

**Active workspace**:
The currently selected Project and QA session used as the default Note assignment and the scope for review and export.

**Draft workspace**:
A newly named Project or QA session that is available for capture but has not entered saved history because it has no Note yet.

**Clear session notes**:
Remove every Note from the active QA session while retaining its Project and QA session.

**Clear project notes**:
Remove every Note from the active Project while retaining the Project and its QA sessions.

**Delete empty session**:
Explicitly remove a QA session that has no Notes while retaining its Project.

**Delete empty project**:
Explicitly remove a Project that has no Notes, including its empty QA sessions.

**Move note**:
Reassign a saved Note to another Project and QA session while preserving its screenshot and capture context.
