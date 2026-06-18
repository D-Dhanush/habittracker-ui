# Stored Procedures Validation Report

---

## ✅ CORRECT PROCEDURES

### 1. USP_CreateHabit ✅
**Status:** Correct
- All parameters match table columns
- Proper defaults applied
- OUTPUT statement returns all key fields
- StartDt default logic works

### 2. USP_GetAllHabits ✅
**Status:** Correct
- Joins with HabitProgress correctly
- Uses ISNULL for progress data
- Filters IsActive = 1
- All column names match table schema

### 3. USP_GetHabitById ✅
**Status:** Correct
- Main habit query with LEFT JOIN to progress
- Multi-result set returns (habit, tasks, milestones, completions)
- 90-day completion filter is appropriate
- All column names match table schema

### 4. USP_UpdateHabit ✅
**Status:** Correct
- Conditional updates with ISNULL pattern
- Updates UpdatedDt timestamp
- Calls USP_GetHabitById to return updated data
- All columns match table schema

### 5. USP_DeleteHabit ✅
**Status:** Correct
- Soft delete pattern (marks as archived)
- Sets IsActive = 0 and Status = 'archived'
- Returns affected row count

### 6. USP_GetAllQuests ✅
**Status:** Correct
- Filters by Status correctly
- Simple, efficient query

### 7. USP_GetQuestById ✅
**Status:** Correct
- Multi-result set (quest, checklist, calendar log)
- 60-day log filter appropriate
- All columns exist in tables

---

## ⚠️ ISSUES FOUND

### Issue 1: USP_RecordHabitCompletion - SCOPE_IDENTITY() Problem
**Location:** Line in sp code
**Problem:** 
```sql
SELECT CAST(SCOPE_IDENTITY() AS UNIQUEIDENTIFIER) AS CompletionId;
```
**Why:** 
- `SCOPE_IDENTITY()` returns numeric type (INT/BIGINT), not UNIQUEIDENTIFIER
- HabitCompletions.Id uses `DEFAULT NEWID()`, not IDENTITY
- SQL Server won't cast numeric directly to UNIQUEIDENTIFIER

**Fix:** Use OUTPUT clause with table variable to capture the inserted ID:
```sql
DECLARE @InsertedIds TABLE (Id UNIQUEIDENTIFIER);

INSERT INTO Habit.HabitCompletions (HabitId, CompletionDate, Completed, XpEarned, Notes)
OUTPUT inserted.Id INTO @InsertedIds
VALUES (@HabitId, @CompletionDateOnly, 1, @XpEarned, @Notes);

SELECT Id AS CompletionId FROM @InsertedIds;
```

---

### Issue 2: USP_RecordHabitCompletion - Missing CurrentLevel & CurrentXP Init
**Location:** INSERT into HabitProgress
**Problem:** HabitProgress table needs:
- `CurrentLevel` (defaults to 1)
- `CurrentXP` (we set this)
- `Streak` (needs calculation)
- `LongestStreak` (needs tracking)
- `TotalCompletions` (we set this)
- `LastCompletionDate` (we set this)
- `Icon` (optional)

**Current code only sets:** CurrentXP, TotalCompletions, LastCompletionDate

**Fix:**
```sql
INSERT INTO Habit.HabitProgress 
    (HabitId, CurrentLevel, CurrentXP, Streak, LongestStreak, TotalCompletions, LastCompletionDate)
VALUES 
    (@HabitId, 1, @XpEarned, 1, 1, 1, @CompletionDate);
```

---

### Issue 3: USP_GetHabitStats - Date Comparison Issue
**Location:** HabitCompletions comparison
**Problem:**
```sql
DECLARE @Today DATETIME2 = CAST(SYSUTCDATETIME() AS DATE);  -- This returns DATE, not DATETIME2
```
**Issue:** `CompletionDate` is DATETIME2, comparing with DATE type needs explicit casting

**Fix:**
```sql
DECLARE @Today DATE = CAST(SYSUTCDATETIME() AS DATE);

-- In WHERE:
COUNT(CASE WHEN CAST(hc.CompletionDate AS DATE) = @Today 
      AND hc.Completed = 1 THEN 1 END) AS CompletedToday
```

---

### Issue 4: Missing Stored Procedures

**Missing:** USP_UpdateQuest
```sql
CREATE PROCEDURE [Quest].[USP_UpdateQuest]
    @QuestId UNIQUEIDENTIFIER,
    @Name NVARCHAR(200) = NULL,
    @Status NVARCHAR(50) = NULL,
    @Progress INT = NULL,
    @CompletionRate INT = NULL,
    @Notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Quest.Quests
    SET
        Name = ISNULL(@Name, Name),
        Status = ISNULL(@Status, Status),
        Progress = ISNULL(@Progress, Progress),
        CompletionRate = ISNULL(@CompletionRate, CompletionRate),
        Notes = ISNULL(@Notes, Notes),
        UpdatedDt = SYSUTCDATETIME()
    WHERE Id = @QuestId;

    EXEC [Quest].[USP_GetQuestById] @QuestId = @QuestId;
END
```

**Missing:** USP_DeleteQuest
```sql
CREATE PROCEDURE [Quest].[USP_DeleteQuest]
    @QuestId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- Soft delete
    UPDATE Quest.Quests
    SET Status = 'Completed', UpdatedDt = SYSUTCDATETIME()
    WHERE Id = @QuestId;

    SELECT @@ROWCOUNT AS RowsAffected;
END
```

**Missing:** USP_AddQuestChecklistTask
```sql
CREATE PROCEDURE [Quest].[USP_AddQuestChecklistTask]
    @QuestId UNIQUEIDENTIFIER,
    @Title NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Quest.QuestChecklistTasks (QuestId, Title, Done)
    OUTPUT inserted.Id, inserted.Title, inserted.Done
    VALUES (@QuestId, @Title, 0);
END
```

**Missing:** USP_UpdateQuestChecklistTask
```sql
CREATE PROCEDURE [Quest].[USP_UpdateQuestChecklistTask]
    @TaskId UNIQUEIDENTIFIER,
    @QuestId UNIQUEIDENTIFIER,
    @Title NVARCHAR(200) = NULL,
    @Done BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Quest.QuestChecklistTasks
    SET
        Title = ISNULL(@Title, Title),
        Done = ISNULL(@Done, Done)
    WHERE Id = @TaskId AND QuestId = @QuestId;

    SELECT @@ROWCOUNT AS RowsAffected;
END
```

**Missing:** USP_LogQuestProgress
```sql
CREATE PROCEDURE [Quest].[USP_LogQuestProgress]
    @QuestId UNIQUEIDENTIFIER,
    @LogDate DATETIME2 = NULL,
    @Completed BIT = 0,
    @Notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @LogDate IS NULL
        SET @LogDate = CAST(SYSUTCDATETIME() AS DATE);

    INSERT INTO Quest.QuestCalendarLog (QuestId, LogDate, Completed, Notes)
    OUTPUT inserted.Id, inserted.LogDate, inserted.Completed, inserted.Notes
    VALUES (@QuestId, @LogDate, @Completed, @Notes);
END
```

---

### Issue 5: Missing Task Management Procedures

**Missing:** USP_AddHabitTask
```sql
CREATE PROCEDURE [Habit].[USP_AddHabitTask]
    @HabitId UNIQUEIDENTIFIER,
    @Name NVARCHAR(200),
    @Description NVARCHAR(MAX) = NULL,
    @XpReward INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Habit.HabitTasks (HabitId, Name, Description, XpReward, Completed)
    OUTPUT inserted.Id, inserted.Name, inserted.Description, inserted.XpReward, 
           inserted.Completed, inserted.CompletedDate, inserted.CreatedDt, inserted.UpdatedDt
    VALUES (@HabitId, @Name, @Description, @XpReward, 0);
END
```

**Missing:** USP_UpdateHabitTask
```sql
CREATE PROCEDURE [Habit].[USP_UpdateHabitTask]
    @TaskId UNIQUEIDENTIFIER,
    @HabitId UNIQUEIDENTIFIER,
    @Name NVARCHAR(200) = NULL,
    @Description NVARCHAR(MAX) = NULL,
    @XpReward INT = NULL,
    @Completed BIT = NULL,
    @CompletedDate DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Habit.HabitTasks
    SET
        Name = ISNULL(@Name, Name),
        Description = ISNULL(@Description, Description),
        XpReward = ISNULL(@XpReward, XpReward),
        Completed = ISNULL(@Completed, Completed),
        CompletedDate = ISNULL(@CompletedDate, CompletedDate),
        UpdatedDt = SYSUTCDATETIME()
    WHERE Id = @TaskId AND HabitId = @HabitId;

    SELECT @@ROWCOUNT AS RowsAffected;
END
```

**Missing:** USP_DeleteHabitTask
```sql
CREATE PROCEDURE [Habit].[USP_DeleteHabitTask]
    @TaskId UNIQUEIDENTIFIER,
    @HabitId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM Habit.HabitTasks
    WHERE Id = @TaskId AND HabitId = @HabitId;

    SELECT @@ROWCOUNT AS RowsAffected;
END
```

---

### Issue 6: Missing Milestone Procedures

**Missing:** USP_AddHabitMilestone
```sql
CREATE PROCEDURE [Habit].[USP_AddHabitMilestone]
    @HabitId UNIQUEIDENTIFIER,
    @Name NVARCHAR(200),
    @Description NVARCHAR(MAX) = NULL,
    @Target INT,
    @XpReward INT,
    @Icon NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Habit.HabitMilestones 
        (HabitId, Name, Description, Target, Achieved, XpReward, Icon)
    OUTPUT inserted.Id, inserted.Name, inserted.Description, inserted.Target, 
           inserted.Achieved, inserted.AchievedDate, inserted.XpReward, inserted.Icon
    VALUES (@HabitId, @Name, @Description, @Target, 0, @XpReward, @Icon);
END
```

**Missing:** USP_AchieveMilestone
```sql
CREATE PROCEDURE [Habit].[USP_AchieveMilestone]
    @MilestoneId UNIQUEIDENTIFIER,
    @HabitId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Habit.HabitMilestones
    SET Achieved = 1, AchievedDate = SYSUTCDATETIME()
    WHERE Id = @MilestoneId AND HabitId = @HabitId AND Achieved = 0;

    SELECT @@ROWCOUNT AS RowsAffected;
END
```

---

## SUMMARY

| Procedure | Status | Issue |
|-----------|--------|-------|
| USP_CreateHabit | ✅ OK | None |
| USP_GetAllHabits | ✅ OK | None |
| USP_GetHabitById | ✅ OK | None |
| USP_UpdateHabit | ✅ OK | None |
| USP_DeleteHabit | ✅ OK | None |
| USP_RecordHabitCompletion | ⚠️ NEEDS FIX | SCOPE_IDENTITY() + Missing HabitProgress fields |
| USP_GetHabitStats | ⚠️ NEEDS FIX | Date comparison casting issue |
| USP_CreateQuest | ✅ OK | None |
| USP_GetAllQuests | ✅ OK | None |
| USP_GetQuestById | ✅ OK | None |
| **Missing (MUST ADD):** | ❌ | USP_UpdateQuest, USP_DeleteQuest, USP_AddQuestChecklistTask, USP_UpdateQuestChecklistTask, USP_LogQuestProgress |
| **Missing (MUST ADD):** | ❌ | USP_AddHabitTask, USP_UpdateHabitTask, USP_DeleteHabitTask, USP_AddHabitMilestone, USP_AchieveMilestone |

---

## ACTION ITEMS

1. ✅ Fix USP_RecordHabitCompletion (SCOPE_IDENTITY issue + HabitProgress init)
2. ✅ Fix USP_GetHabitStats (date casting)
3. ✅ Add all 8 missing stored procedures
4. ✅ Test all procedures with sample data

