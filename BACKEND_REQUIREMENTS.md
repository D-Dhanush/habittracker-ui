# Backend Requirements - Analysis vs Frontend

## MISSING ITEMS & CORRECTIONS NEEDED

---

## 1. DATABASE TABLE CORRECTIONS & ADDITIONS

### ❌ CURRENT HABITS TABLE - MISSING FIELDS
The current Habits table is **incomplete**. Missing fields:
- `Category` (NVARCHAR(50)) - Examples: 'fitness', 'health', 'spiritual', 'finance', 'study', 'productivity', 'mindset', 'lifestyle', 'custom'
- `CustomCategory` (NVARCHAR(100)) - For when category is 'custom'
- `Status` (NVARCHAR(50)) - Examples: 'active', 'paused', 'completed', 'archived'
- `EndDt` (DATETIME2) - Optional end date for the habit
- `Subtitle` (NVARCHAR(250)) - Short description/subtitle
- `Icon` (NVARCHAR(100)) - Material icon name
- `PrimaryColor` (VARCHAR(7)) - Hex color code
- `SecondaryColor` (VARCHAR(7)) - Hex color code
- `XpReward` (INT) - XP points earned per completion
- `Notes` (NVARCHAR(MAX)) - General notes about the habit

### ✅ CORRECTED HABITS TABLE STRUCTURE

```sql
CREATE TABLE [Habit].[Habits] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Name] NVARCHAR(200) NOT NULL,
    [Subtitle] NVARCHAR(250),
    [Description] NVARCHAR(MAX),
    [Category] NVARCHAR(50) NOT NULL, -- 'fitness', 'health', 'spiritual', 'finance', 'study', 'productivity', 'mindset', 'lifestyle', 'custom'
    [CustomCategory] NVARCHAR(100),
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'paused', 'completed', 'archived'
    [Frequency] NVARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'bi-weekly', 'monthly'
    [StartDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [EndDt] DATETIME2,
    [TargetOccurrencesPerPeriod] INT,
    [ReminderTimeUtc] TIME(7),
    [Icon] NVARCHAR(100),
    [PrimaryColor] VARCHAR(7), -- Hex color, e.g., '#d4af37'
    [SecondaryColor] VARCHAR(7), -- Hex color, e.g., '#4dd9ff'
    [XpReward] INT DEFAULT 50,
    [Tags] NVARCHAR(MAX), -- JSON array as string
    [Notes] NVARCHAR(MAX),
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [SysStartTime] DATETIME2 GENERATED ALWAYS AS ROW START,
    [SysEndTime] DATETIME2 GENERATED ALWAYS AS ROW END,
    PERIOD FOR SYSTEM_TIME ([SysStartTime], [SysEndTime])
) WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = [Habit].[Habits_History]));
```

---

### ✅ NEW TABLE: HabitTasks
```sql
CREATE TABLE [Habit].[HabitTasks] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [HabitId] UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES [Habit].[Habits]([Id]) ON DELETE CASCADE,
    [Name] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(MAX),
    [XpReward] INT DEFAULT 10,
    [Completed] BIT DEFAULT 0,
    [CompletedDate] DATETIME2,
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
```

---

### ✅ NEW TABLE: HabitCompletions (REPLACES/COMPLEMENTS HabitProgress)
```sql
CREATE TABLE [Habit].[HabitCompletions] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [HabitId] UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES [Habit].[Habits]([Id]) ON DELETE CASCADE,
    [CompletionDate] DATETIME2 NOT NULL,
    [Completed] BIT NOT NULL DEFAULT 1,
    [XpEarned] INT DEFAULT 0,
    [Notes] NVARCHAR(MAX),
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    INDEX IX_HabitId_CompletionDate CLUSTERED ([HabitId], [CompletionDate] DESC)
);
```

---

### ✅ DEPRECATE/REPLACE: HabitProgress
The current `HabitProgress` table needs to be **replaced** with `HabitCompletions`. 
If you need to keep it for backward compatibility, update it to:

```sql
CREATE TABLE [Habit].[HabitProgress] (
    [HabitId] UNIQUEIDENTIFIER PRIMARY KEY FOREIGN KEY REFERENCES [Habit].[Habits]([Id]) ON DELETE CASCADE,
    [CurrentLevel] INT DEFAULT 1,
    [CurrentXP] INT DEFAULT 0,
    [Streak] INT DEFAULT 0,
    [LongestStreak] INT DEFAULT 0,
    [LastCompletionDate] DATETIME2,
    [TotalCompletions] INT DEFAULT 0,
    [Icon] NVARCHAR(100),
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
```

---

### ✅ NEW TABLE: HabitMilestones
```sql
CREATE TABLE [Habit].[HabitMilestones] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [HabitId] UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES [Habit].[Habits]([Id]) ON DELETE CASCADE,
    [Name] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(MAX),
    [Target] INT NOT NULL, -- Days or streak count
    [Achieved] BIT DEFAULT 0,
    [AchievedDate] DATETIME2,
    [XpReward] INT NOT NULL,
    [Icon] NVARCHAR(100),
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
```

---

### ✅ NEW TABLE: Quests
```sql
CREATE TABLE [Quest].[Quests] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Name] NVARCHAR(200) NOT NULL,
    [Category] NVARCHAR(100) NOT NULL,
    [Difficulty] NVARCHAR(50) NOT NULL, -- 'Easy', 'Medium', 'Hard'
    [Xp] INT NOT NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active', -- 'Active', 'Paused', 'Completed'
    [Icon] NVARCHAR(100),
    [Description] NVARCHAR(MAX),
    [Progress] INT DEFAULT 0, -- Percentage 0-100
    [CompletionRate] INT DEFAULT 0,
    [Notes] NVARCHAR(MAX),
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
```

---

### ✅ NEW TABLE: QuestChecklistTasks
```sql
CREATE TABLE [Quest].[QuestChecklistTasks] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [QuestId] UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES [Quest].[Quests]([Id]) ON DELETE CASCADE,
    [Title] NVARCHAR(200) NOT NULL,
    [Done] BIT DEFAULT 0,
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
```

---

### ✅ NEW TABLE: QuestCalendarLog
```sql
CREATE TABLE [Quest].[QuestCalendarLog] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [QuestId] UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES [Quest].[Quests]([Id]) ON DELETE CASCADE,
    [LogDate] DATETIME2 NOT NULL,
    [Completed] BIT NOT NULL DEFAULT 0,
    [Notes] NVARCHAR(MAX),
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
```

---

## 2. STORED PROCEDURES - CORRECTIONS & ADDITIONS

### ✅ UPDATED: USP_CreateHabit
```sql
ALTER PROCEDURE [Habit].[USP_CreateHabit]
    @Id UNIQUEIDENTIFIER = NULL,
    @Name NVARCHAR(200),
    @Subtitle NVARCHAR(250) = NULL,
    @Description NVARCHAR(MAX) = NULL,
    @Category NVARCHAR(50),
    @CustomCategory NVARCHAR(100) = NULL,
    @Status NVARCHAR(50) = 'active',
    @Frequency NVARCHAR(50),
    @StartDt DATETIME2 = NULL,
    @EndDt DATETIME2 = NULL,
    @TargetOccurrencesPerPeriod INT = NULL,
    @ReminderTimeUtc TIME(7) = NULL,
    @Icon NVARCHAR(100) = NULL,
    @PrimaryColor VARCHAR(7) = NULL,
    @SecondaryColor VARCHAR(7) = NULL,
    @XpReward INT = 50,
    @Tags NVARCHAR(MAX) = NULL,
    @Notes NVARCHAR(MAX) = NULL,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF @Id IS NULL
        SET @Id = NEWID();

    IF @StartDt IS NULL
        SET @StartDt = SYSUTCDATETIME();

    INSERT INTO Habit.Habits (
        Id, Name, Subtitle, Description, Category, CustomCategory, Status, 
        Frequency, StartDt, EndDt, TargetOccurrencesPerPeriod, ReminderTimeUtc, 
        Icon, PrimaryColor, SecondaryColor, XpReward, Tags, Notes, IsActive
    )
    OUTPUT
        inserted.Id,
        inserted.Name,
        inserted.Subtitle,
        inserted.Description,
        inserted.Category,
        inserted.CustomCategory,
        inserted.Status,
        inserted.Frequency,
        inserted.StartDt,
        inserted.EndDt,
        inserted.TargetOccurrencesPerPeriod,
        inserted.ReminderTimeUtc,
        inserted.Icon,
        inserted.PrimaryColor,
        inserted.SecondaryColor,
        inserted.XpReward,
        inserted.Tags,
        inserted.Notes,
        inserted.IsActive,
        inserted.CreatedDt,
        inserted.UpdatedDt
    VALUES (
        @Id, @Name, @Subtitle, @Description, @Category, @CustomCategory, @Status,
        @Frequency, @StartDt, @EndDt, @TargetOccurrencesPerPeriod, @ReminderTimeUtc,
        @Icon, @PrimaryColor, @SecondaryColor, @XpReward, @Tags, @Notes, @IsActive
    );
END
```

---

### ✅ UPDATED: USP_GetAllHabits
```sql
ALTER PROCEDURE [Habit].[USP_GetAllHabits]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        h.Id,
        h.Name,
        h.Subtitle,
        h.Description,
        h.Category,
        h.CustomCategory,
        h.Status,
        h.Frequency,
        h.StartDt,
        h.EndDt,
        h.TargetOccurrencesPerPeriod,
        h.ReminderTimeUtc,
        h.Icon,
        h.PrimaryColor,
        h.SecondaryColor,
        h.XpReward,
        h.Tags,
        h.Notes,
        h.IsActive,
        h.CreatedDt,
        h.UpdatedDt,
        ISNULL(hp.CurrentXP, 0) AS CurrentXP,
        ISNULL(hp.Streak, 0) AS Streak,
        ISNULL(hp.TotalCompletions, 0) AS TotalCompletions,
        hp.LastCompletionDate
    FROM Habit.Habits h
    LEFT JOIN Habit.HabitProgress hp ON h.Id = hp.HabitId
    WHERE h.IsActive = 1
    ORDER BY h.Name;
END
```

---

### ✅ UPDATED: USP_GetHabitById
```sql
ALTER PROCEDURE [Habit].[USP_GetHabitById]
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- Get main habit
    SELECT
        h.Id,
        h.Name,
        h.Subtitle,
        h.Description,
        h.Category,
        h.CustomCategory,
        h.Status,
        h.Frequency,
        h.StartDt,
        h.EndDt,
        h.TargetOccurrencesPerPeriod,
        h.ReminderTimeUtc,
        h.Icon,
        h.PrimaryColor,
        h.SecondaryColor,
        h.XpReward,
        h.Tags,
        h.Notes,
        h.IsActive,
        h.CreatedDt,
        h.UpdatedDt,
        ISNULL(hp.CurrentXP, 0) AS CurrentXP,
        ISNULL(hp.Streak, 0) AS Streak,
        ISNULL(hp.TotalCompletions, 0) AS TotalCompletions,
        hp.LastCompletionDate
    FROM Habit.Habits h
    LEFT JOIN Habit.HabitProgress hp ON h.Id = hp.HabitId
    WHERE h.Id = @Id;

    -- Get associated tasks
    SELECT Id, Name, Description, XpReward, Completed, CompletedDate, CreatedDt, UpdatedDt
    FROM Habit.HabitTasks
    WHERE HabitId = @Id;

    -- Get milestones
    SELECT Id, Name, Description, Target, Achieved, AchievedDate, XpReward, Icon, CreatedDt
    FROM Habit.HabitMilestones
    WHERE HabitId = @Id;

    -- Get recent completions (last 90 days)
    SELECT Id, CompletionDate, Completed, XpEarned, Notes, CreatedDt
    FROM Habit.HabitCompletions
    WHERE HabitId = @Id AND CompletionDate >= DATEADD(DAY, -90, SYSUTCDATETIME())
    ORDER BY CompletionDate DESC;
END
```

---

### ✅ NEW: USP_UpdateHabit
```sql
CREATE PROCEDURE [Habit].[USP_UpdateHabit]
    @Id UNIQUEIDENTIFIER,
    @Name NVARCHAR(200) = NULL,
    @Subtitle NVARCHAR(250) = NULL,
    @Description NVARCHAR(MAX) = NULL,
    @Category NVARCHAR(50) = NULL,
    @CustomCategory NVARCHAR(100) = NULL,
    @Status NVARCHAR(50) = NULL,
    @Frequency NVARCHAR(50) = NULL,
    @EndDt DATETIME2 = NULL,
    @TargetOccurrencesPerPeriod INT = NULL,
    @ReminderTimeUtc TIME(7) = NULL,
    @Icon NVARCHAR(100) = NULL,
    @PrimaryColor VARCHAR(7) = NULL,
    @SecondaryColor VARCHAR(7) = NULL,
    @XpReward INT = NULL,
    @Tags NVARCHAR(MAX) = NULL,
    @Notes NVARCHAR(MAX) = NULL,
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Habit.Habits
    SET
        Name = ISNULL(@Name, Name),
        Subtitle = ISNULL(@Subtitle, Subtitle),
        Description = ISNULL(@Description, Description),
        Category = ISNULL(@Category, Category),
        CustomCategory = ISNULL(@CustomCategory, CustomCategory),
        Status = ISNULL(@Status, Status),
        Frequency = ISNULL(@Frequency, Frequency),
        EndDt = ISNULL(@EndDt, EndDt),
        TargetOccurrencesPerPeriod = ISNULL(@TargetOccurrencesPerPeriod, TargetOccurrencesPerPeriod),
        ReminderTimeUtc = ISNULL(@ReminderTimeUtc, ReminderTimeUtc),
        Icon = ISNULL(@Icon, Icon),
        PrimaryColor = ISNULL(@PrimaryColor, PrimaryColor),
        SecondaryColor = ISNULL(@SecondaryColor, SecondaryColor),
        XpReward = ISNULL(@XpReward, XpReward),
        Tags = ISNULL(@Tags, Tags),
        Notes = ISNULL(@Notes, Notes),
        IsActive = ISNULL(@IsActive, IsActive),
        UpdatedDt = SYSUTCDATETIME()
    WHERE Id = @Id;

    -- Return updated habit
    EXEC [Habit].[USP_GetHabitById] @Id = @Id;
END
```

---

### ✅ NEW: USP_DeleteHabit
```sql
CREATE PROCEDURE [Habit].[USP_DeleteHabit]
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- Soft delete (mark as inactive)
    UPDATE Habit.Habits
    SET IsActive = 0, Status = 'archived', UpdatedDt = SYSUTCDATETIME()
    WHERE Id = @Id;

    SELECT @@ROWCOUNT AS RowsAffected;
END
```

---

### ✅ NEW: USP_RecordHabitCompletion
```sql
CREATE PROCEDURE [Habit].[USP_RecordHabitCompletion]
    @HabitId UNIQUEIDENTIFIER,
    @CompletionDate DATETIME2 = NULL,
    @XpEarned INT = 0,
    @Notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CompletionDateOnly DATE;
    DECLARE @InsertedIds TABLE (Id UNIQUEIDENTIFIER);

    IF @CompletionDate IS NULL
        SET @CompletionDate = SYSUTCDATETIME();

    SET @CompletionDateOnly = CAST(@CompletionDate AS DATE);

    -- Insert completion record and capture the ID
    INSERT INTO Habit.HabitCompletions (HabitId, CompletionDate, Completed, XpEarned, Notes)
    OUTPUT inserted.Id INTO @InsertedIds
    VALUES (@HabitId, @CompletionDateOnly, 1, @XpEarned, @Notes);

    -- Update or Create HabitProgress
    IF EXISTS (SELECT 1 FROM Habit.HabitProgress WHERE HabitId = @HabitId)
    BEGIN
        UPDATE Habit.HabitProgress
        SET
            CurrentXP = CurrentXP + @XpEarned,
            TotalCompletions = TotalCompletions + 1,
            LastCompletionDate = @CompletionDateOnly,
            UpdatedDt = SYSUTCDATETIME()
        WHERE HabitId = @HabitId;
    END
    ELSE
    BEGIN
        INSERT INTO Habit.HabitProgress 
            (HabitId, CurrentLevel, CurrentXP, Streak, LongestStreak, TotalCompletions, LastCompletionDate)
        VALUES (@HabitId, 1, @XpEarned, 1, 1, 1, @CompletionDateOnly);
    END

    -- Return the inserted ID
    SELECT Id AS CompletionId FROM @InsertedIds;
END
```

---

### ✅ NEW: USP_GetHabitStats
```sql
CREATE PROCEDURE [Habit].[USP_GetHabitStats]
    @UserId NVARCHAR(450) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Today DATE = CAST(SYSUTCDATETIME() AS DATE);

    SELECT
        COUNT(DISTINCT h.Id) AS TotalHabits,
        COUNT(DISTINCT CASE WHEN h.Status = 'active' THEN h.Id END) AS ActiveHabits,
        ISNULL(SUM(hp.CurrentXP), 0) AS TotalXpEarned,
        MAX(hp.LongestStreak) AS LongestStreak,
        COUNT(DISTINCT CASE WHEN CAST(hc.CompletionDate AS DATE) = @Today AND hc.Completed = 1 THEN hc.HabitId END) AS CompletedToday
    FROM Habit.Habits h
    LEFT JOIN Habit.HabitProgress hp ON h.Id = hp.HabitId
    LEFT JOIN Habit.HabitCompletions hc ON h.Id = hc.HabitId
    WHERE h.IsActive = 1;
END
```

---

### ✅ NEW: USP_CreateQuest
```sql
CREATE PROCEDURE [Quest].[USP_CreateQuest]
    @Name NVARCHAR(200),
    @Category NVARCHAR(100),
    @Difficulty NVARCHAR(50),
    @Xp INT,
    @Icon NVARCHAR(100) = NULL,
    @Description NVARCHAR(MAX) = NULL,
    @Notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @QuestId UNIQUEIDENTIFIER = NEWID();

    INSERT INTO Quest.Quests (Id, Name, Category, Difficulty, Xp, Status, Icon, Description, Notes)
    OUTPUT inserted.*
    VALUES (@QuestId, @Name, @Category, @Difficulty, @Xp, 'Active', @Icon, @Description, @Notes);
END
```

---

### ✅ NEW: USP_GetAllQuests
```sql
CREATE PROCEDURE [Quest].[USP_GetAllQuests]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM Quest.Quests WHERE Status IN ('Active', 'Paused');
END
```

---

### ✅ NEW: USP_GetQuestById
```sql
CREATE PROCEDURE [Quest].[USP_GetQuestById]
    @QuestId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- Get quest
    SELECT * FROM Quest.Quests WHERE Id = @QuestId;

    -- Get checklist tasks
    SELECT Id, Title, Done FROM Quest.QuestChecklistTasks WHERE QuestId = @QuestId;

    -- Get calendar log (last 60 days)
    SELECT LogDate, Completed, Notes FROM Quest.QuestCalendarLog
    WHERE QuestId = @QuestId AND LogDate >= DATEADD(DAY, -60, SYSUTCDATETIME())
    ORDER BY LogDate DESC;
END
```

---

### ✅ NEW: USP_UpdateQuest
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

---

### ✅ NEW: USP_DeleteQuest
```sql
CREATE PROCEDURE [Quest].[USP_DeleteQuest]
    @QuestId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- Soft delete - mark as completed
    UPDATE Quest.Quests
    SET Status = 'Completed', UpdatedDt = SYSUTCDATETIME()
    WHERE Id = @QuestId;

    SELECT @@ROWCOUNT AS RowsAffected;
END
```

---

### ✅ NEW: USP_AddQuestChecklistTask
```sql
CREATE PROCEDURE [Quest].[USP_AddQuestChecklistTask]
    @QuestId UNIQUEIDENTIFIER,
    @Title NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Quest.QuestChecklistTasks (QuestId, Title, Done)
    OUTPUT inserted.Id, inserted.Title, inserted.Done, inserted.CreatedDt
    VALUES (@QuestId, @Title, 0);
END
```

---

### ✅ NEW: USP_UpdateQuestChecklistTask
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

---

### ✅ NEW: USP_LogQuestProgress
```sql
CREATE PROCEDURE [Quest].[USP_LogQuestProgress]
    @QuestId UNIQUEIDENTIFIER,
    @LogDate DATETIME2 = NULL,
    @Completed BIT = 0,
    @Notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @LogDateOnly DATE;

    IF @LogDate IS NULL
        SET @LogDate = SYSUTCDATETIME();

    SET @LogDateOnly = CAST(@LogDate AS DATE);

    INSERT INTO Quest.QuestCalendarLog (QuestId, LogDate, Completed, Notes)
    OUTPUT inserted.Id, inserted.LogDate, inserted.Completed, inserted.Notes, inserted.CreatedDt
    VALUES (@QuestId, @LogDateOnly, @Completed, @Notes);
END
```

---

### ✅ NEW: USP_AddHabitTask
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

---

### ✅ NEW: USP_UpdateHabitTask
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

---

### ✅ NEW: USP_DeleteHabitTask
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

### ✅ NEW: USP_AddHabitMilestone
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
           inserted.Achieved, inserted.AchievedDate, inserted.XpReward, inserted.Icon, inserted.CreatedDt
    VALUES (@HabitId, @Name, @Description, @Target, 0, @XpReward, @Icon);
END
```

---

### ✅ NEW: USP_AchieveMilestone
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

## 3. API CONTROLLER - MISSING ENDPOINTS & CORRECTIONS

### ✅ CORRECTED & COMPLETE: HabitController

```csharp
using Microsoft.AspNetCore.Mvc;
using HabitTrackerApi.Services;
using HabitTrackerApi.InputModels;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HabitTrackerApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HabitController : ControllerBase
{
    private readonly IHabitService _habitService;

    public HabitController(IHabitService habitService)
    {
        _habitService = habitService;
    }

    // POST api/habit - Create new habit
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] HabitInputDto input)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var created = await _habitService.CreateAsync(input);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    // GET api/habit - Get all active habits
    [HttpGet]
    public async Task<IActionResult> GetAllHabits()
    {
        var habits = await _habitService.GetAllHabits();
        if (habits is null) return NotFound();
        return Ok(habits);
    }

    // GET api/habit/{id} - Get specific habit by ID
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var habit = await _habitService.GetByIdAsync(id);
        if (habit is null) return NotFound();
        return Ok(habit);
    }

    // PUT api/habit/{id} - Update habit
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] HabitUpdateDto input)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var updated = await _habitService.UpdateAsync(id, input);
        if (updated is null) return NotFound();
        return Ok(updated);
    }

    // DELETE api/habit/{id} - Delete/archive habit
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _habitService.DeleteAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    // POST api/habit/{habitId}/complete - Record habit completion
    [HttpPost("{habitId:guid}/complete")]
    public async Task<IActionResult> CompleteHabit(Guid habitId, [FromBody] HabitCompletionDto input)
    {
        var result = await _habitService.RecordCompletionAsync(habitId, input);
        if (result is null) return NotFound();
        return Ok(result);
    }

    // GET api/habit/stats - Get stats
    [HttpGet("stats/overview")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _habitService.GetStatsAsync();
        return Ok(stats);
    }

    // POST api/habit/{habitId}/tasks - Add task to habit
    [HttpPost("{habitId:guid}/tasks")]
    public async Task<IActionResult> AddTask(Guid habitId, [FromBody] HabitTaskDto input)
    {
        var result = await _habitService.AddTaskAsync(habitId, input);
        if (result is null) return NotFound();
        return CreatedAtAction(nameof(GetById), new { id = habitId }, result);
    }

    // DELETE api/habit/{habitId}/tasks/{taskId} - Delete task
    [HttpDelete("{habitId:guid}/tasks/{taskId:guid}")]
    public async Task<IActionResult> DeleteTask(Guid habitId, Guid taskId)
    {
        var result = await _habitService.DeleteTaskAsync(habitId, taskId);
        if (!result) return NotFound();
        return NoContent();
    }

    // PUT api/habit/{habitId}/tasks/{taskId} - Update task
    [HttpPut("{habitId:guid}/tasks/{taskId:guid}")]
    public async Task<IActionResult> UpdateTask(Guid habitId, Guid taskId, [FromBody] HabitTaskUpdateDto input)
    {
        var result = await _habitService.UpdateTaskAsync(habitId, taskId, input);
        if (result is null) return NotFound();
        return Ok(result);
    }
}
```

---

### ✅ NEW: QuestController

```csharp
using Microsoft.AspNetCore.Mvc;
using HabitTrackerApi.Services;
using HabitTrackerApi.InputModels;
using System;
using System.Threading.Tasks;

namespace HabitTrackerApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuestController : ControllerBase
{
    private readonly IQuestService _questService;

    public QuestController(IQuestService questService)
    {
        _questService = questService;
    }

    // POST api/quest - Create new quest
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] QuestInputDto input)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var created = await _questService.CreateAsync(input);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    // GET api/quest - Get all active quests
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var quests = await _questService.GetAllAsync();
        return Ok(quests);
    }

    // GET api/quest/{id} - Get specific quest
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var quest = await _questService.GetByIdAsync(id);
        if (quest is null) return NotFound();
        return Ok(quest);
    }

    // PUT api/quest/{id} - Update quest
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] QuestUpdateDto input)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var updated = await _questService.UpdateAsync(id, input);
        if (updated is null) return NotFound();
        return Ok(updated);
    }

    // DELETE api/quest/{id} - Delete quest
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _questService.DeleteAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    // POST api/quest/{questId}/checklist - Add checklist task
    [HttpPost("{questId:guid}/checklist")]
    public async Task<IActionResult> AddChecklistTask(Guid questId, [FromBody] ChecklistTaskDto input)
    {
        var result = await _questService.AddChecklistTaskAsync(questId, input);
        if (result is null) return NotFound();
        return Ok(result);
    }

    // PUT api/quest/{questId}/checklist/{taskId} - Update checklist task status
    [HttpPut("{questId:guid}/checklist/{taskId:guid}")]
    public async Task<IActionResult> UpdateChecklistTask(Guid questId, Guid taskId, [FromBody] ChecklistTaskUpdateDto input)
    {
        var result = await _questService.UpdateChecklistTaskAsync(questId, taskId, input);
        if (result is null) return NotFound();
        return Ok(result);
    }

    // POST api/quest/{questId}/log - Log daily quest progress
    [HttpPost("{questId:guid}/log")]
    public async Task<IActionResult> LogProgress(Guid questId, [FromBody] QuestLogDto input)
    {
        var result = await _questService.LogProgressAsync(questId, input);
        if (result is null) return NotFound();
        return Ok(result);
    }

    // PUT api/quest/{questId}/progress - Update quest progress percentage
    [HttpPut("{questId:guid}/progress")]
    public async Task<IActionResult> UpdateProgress(Guid questId, [FromBody] UpdateProgressDto input)
    {
        var result = await _questService.UpdateProgressAsync(questId, input.Progress);
        if (result is null) return NotFound();
        return Ok(result);
    }
}
```

---

## 4. REQUIRED INPUT DTOs

```csharp
// HabitInputDto.cs
public class HabitInputDto
{
    public string Name { get; set; }
    public string Subtitle { get; set; }
    public string Description { get; set; }
    public string Category { get; set; } // 'fitness', 'health', 'spiritual', etc.
    public string CustomCategory { get; set; }
    public string Frequency { get; set; } // 'daily', 'weekly', 'bi-weekly', 'monthly'
    public DateTime? StartDateUtc { get; set; }
    public DateTime? EndDateUtc { get; set; }
    public int? TargetOccurrencesPerPeriod { get; set; }
    public TimeSpan? ReminderTimeUtc { get; set; }
    public string Icon { get; set; }
    public string PrimaryColor { get; set; }
    public string SecondaryColor { get; set; }
    public int? XpReward { get; set; }
    public List<string> Tags { get; set; }
    public string Notes { get; set; }
    public bool? IsActive { get; set; }
}

// HabitUpdateDto.cs
public class HabitUpdateDto
{
    public string Name { get; set; }
    public string Subtitle { get; set; }
    public string Description { get; set; }
    public string Status { get; set; } // 'active', 'paused', 'completed', 'archived'
    public string Frequency { get; set; }
    public DateTime? EndDateUtc { get; set; }
    public int? TargetOccurrencesPerPeriod { get; set; }
    public TimeSpan? ReminderTimeUtc { get; set; }
    public string Icon { get; set; }
    public string PrimaryColor { get; set; }
    public string SecondaryColor { get; set; }
    public int? XpReward { get; set; }
    public List<string> Tags { get; set; }
    public string Notes { get; set; }
}

// HabitCompletionDto.cs
public class HabitCompletionDto
{
    public DateTime? CompletionDate { get; set; }
    public int? XpEarned { get; set; }
    public string Notes { get; set; }
}

// HabitTaskDto.cs
public class HabitTaskDto
{
    public string Name { get; set; }
    public string Description { get; set; }
    public int? XpReward { get; set; }
}

// HabitTaskUpdateDto.cs
public class HabitTaskUpdateDto
{
    public string Name { get; set; }
    public string Description { get; set; }
    public int? XpReward { get; set; }
    public bool? Completed { get; set; }
}

// QuestInputDto.cs
public class QuestInputDto
{
    public string Name { get; set; }
    public string Category { get; set; }
    public string Difficulty { get; set; } // 'Easy', 'Medium', 'Hard'
    public int Xp { get; set; }
    public string Icon { get; set; }
    public string Description { get; set; }
    public string Notes { get; set; }
}

// QuestUpdateDto.cs
public class QuestUpdateDto
{
    public string Name { get; set; }
    public string Category { get; set; }
    public string Difficulty { get; set; }
    public int? Xp { get; set; }
    public string Status { get; set; } // 'Active', 'Paused', 'Completed'
    public int? Progress { get; set; }
    public string Description { get; set; }
    public string Notes { get; set; }
}

// ChecklistTaskDto.cs
public class ChecklistTaskDto
{
    public string Title { get; set; }
}

// ChecklistTaskUpdateDto.cs
public class ChecklistTaskUpdateDto
{
    public string Title { get; set; }
    public bool Done { get; set; }
}

// QuestLogDto.cs
public class QuestLogDto
{
    public DateTime LogDate { get; set; }
    public bool Completed { get; set; }
    public string Notes { get; set; }
}

// UpdateProgressDto.cs
public class UpdateProgressDto
{
    public int Progress { get; set; } // 0-100
}
```

---

## SUMMARY OF CHANGES NEEDED

| Item | Status | Action |
|------|--------|--------|
| **Habits Table** | ❌ Missing Fields | Add: Category, Status, Icon, Colors, XpReward, Subtitle, Notes, EndDt, CustomCategory |
| **HabitTasks Table** | ❌ Missing | CREATE new table |
| **HabitCompletions Table** | ❌ Missing | CREATE new table (to replace/complement HabitProgress) |
| **HabitMilestones Table** | ❌ Missing | CREATE new table |
| **Quests Table** | ❌ Missing | CREATE new table with all quest fields |
| **QuestChecklistTasks Table** | ❌ Missing | CREATE new table |
| **QuestCalendarLog Table** | ❌ Missing | CREATE new table |
| **USP_CreateHabit** | ✅ Fixed | Updated with all new fields |
| **USP_GetAllHabits** | ✅ Fixed | Updated with all new fields and joined progress data |
| **USP_GetHabitById** | ✅ Fixed | Updated to return tasks, milestones, completions |
| **USP_UpdateHabit** | ✅ Added | CREATE new stored procedure |
| **USP_DeleteHabit** | ✅ Added | CREATE new stored procedure |
| **USP_RecordHabitCompletion** | ✅ Fixed | Fixed SCOPE_IDENTITY issue + added HabitProgress field init |
| **USP_GetHabitStats** | ✅ Fixed | Fixed date type casting and LongestStreak reference |
| **USP_CreateQuest** | ✅ Added | CREATE new stored procedure |
| **USP_GetAllQuests** | ✅ Added | CREATE new stored procedure |
| **USP_GetQuestById** | ✅ Added | CREATE new stored procedure |
| **USP_UpdateQuest** | ✅ Added | CREATE new stored procedure |
| **USP_DeleteQuest** | ✅ Added | CREATE new stored procedure |
| **USP_AddQuestChecklistTask** | ✅ Added | CREATE new stored procedure |
| **USP_UpdateQuestChecklistTask** | ✅ Added | CREATE new stored procedure |
| **USP_LogQuestProgress** | ✅ Added | CREATE new stored procedure |
| **USP_AddHabitTask** | ✅ Added | CREATE new stored procedure |
| **USP_UpdateHabitTask** | ✅ Added | CREATE new stored procedure |
| **USP_DeleteHabitTask** | ✅ Added | CREATE new stored procedure |
| **USP_AddHabitMilestone** | ✅ Added | CREATE new stored procedure |
| **USP_AchieveMilestone** | ✅ Added | CREATE new stored procedure |
| **HabitController** | ⚠️ Incomplete | Add: Update, Delete, Complete, Stats endpoints |
| **QuestController** | ❌ Missing | CREATE entire controller |
| **DTOs** | ⚠️ Incomplete | Create all input and update DTOs |
| **IHabitService** | ⚠️ Incomplete | Add new service methods |
| **IQuestService** | ❌ Missing | CREATE entire service interface |

---

## PRIORITY IMPLEMENTATION ORDER

1. ✅ Create missing tables (HabitTasks, HabitCompletions, HabitMilestones, Quests, etc.)
2. ✅ Update Habits table schema
3. ✅ Update existing stored procedures
4. ✅ Create new stored procedures
5. ✅ Create all DTOs
6. ✅ Update HabitService and HabitController
7. ✅ Create QuestService and QuestController
8. ✅ Test all endpoints
