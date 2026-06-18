# Database Migration Plan - What to Do with Existing Tables

---

## EXISTING TABLE 1: `Habit.Habits`

### ⚠️ ACTION: **UPDATE SCHEMA** (DO NOT DELETE)

**Reason:** Contains actual user data. Needs new columns added.

### SQL Migration Script:

```sql
-- Add new columns to Habits table
ALTER TABLE [Habit].[Habits] ADD
    [Subtitle] NVARCHAR(250),
    [Category] NVARCHAR(50) NOT NULL DEFAULT 'custom',
    [CustomCategory] NVARCHAR(100),
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'active',
    [EndDt] DATETIME2,
    [Icon] NVARCHAR(100),
    [PrimaryColor] VARCHAR(7) DEFAULT '#d4af37',
    [SecondaryColor] VARCHAR(7) DEFAULT '#4dd9ff',
    [XpReward] INT DEFAULT 50,
    [Notes] NVARCHAR(MAX);

-- Verify the update
SELECT * FROM [Habit].[Habits] LIMIT 1;
```

**What This Does:**
- ✅ Keeps all existing habit data
- ✅ Adds 10 new columns with defaults
- ✅ No data loss
- ✅ Safe to run on production

**Timeline:** < 1 second

---

## EXISTING TABLE 2: `Habit.HabitProgress`

### ⚠️ ACTION: **UPDATE SCHEMA** (DO NOT DELETE)

**Reason:** Tracks progress per habit. Needs one new column.

### SQL Migration Script:

```sql
-- Add missing column to HabitProgress
ALTER TABLE [Habit].[HabitProgress] ADD
    [LongestStreak] INT DEFAULT 0;

-- Verify the update
SELECT * FROM [Habit].[HabitProgress] LIMIT 1;
```

**What This Does:**
- ✅ Keeps all existing progress data
- ✅ Adds tracking for longest streak
- ✅ No data loss

**Timeline:** < 1 second

---

## ✅ NEW TABLES TO CREATE

| Table | Purpose | Action |
|-------|---------|--------|
| `Habit.HabitTasks` | Sub-tasks within habits | **CREATE** |
| `Habit.HabitCompletions` | Daily completion records | **CREATE** |
| `Habit.HabitMilestones` | Achievements/milestones | **CREATE** |
| `Quest.Quests` | Quest records | **CREATE** |
| `Quest.QuestChecklistTasks` | Quest checklist items | **CREATE** |
| `Quest.QuestCalendarLog` | Daily quest logs | **CREATE** |

---

## MIGRATION SEQUENCE (DO THIS IN ORDER)

### Step 1: Backup Database ⚡
```sql
-- Create backup (optional but recommended)
BACKUP DATABASE [HabitTracker] 
TO DISK = 'C:\Backups\HabitTracker_2026_06_13.bak';
```

### Step 2: Update Existing Tables

```sql
-- Update Habits table
ALTER TABLE [Habit].[Habits] ADD
    [Subtitle] NVARCHAR(250),
    [Category] NVARCHAR(50) NOT NULL DEFAULT 'custom',
    [CustomCategory] NVARCHAR(100),
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'active',
    [EndDt] DATETIME2,
    [Icon] NVARCHAR(100),
    [PrimaryColor] VARCHAR(7) DEFAULT '#d4af37',
    [SecondaryColor] VARCHAR(7) DEFAULT '#4dd9ff',
    [XpReward] INT DEFAULT 50,
    [Notes] NVARCHAR(MAX);

-- Update HabitProgress table
ALTER TABLE [Habit].[HabitProgress] ADD
    [LongestStreak] INT DEFAULT 0;
```

### Step 3: Create New Tables (WITH SYSTEM VERSIONING for History Tracking)

```sql
-- ====================================
-- Create HabitTasks table WITH HISTORY
-- ====================================
CREATE TABLE [Habit].[HabitTasks] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [HabitId] UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES [Habit].[Habits]([Id]) ON DELETE CASCADE,
    [Name] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(MAX),
    [XpReward] INT DEFAULT 10,
    [Completed] BIT DEFAULT 0,
    [CompletedDate] DATETIME2,
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [SysStartTime] DATETIME2 GENERATED ALWAYS AS ROW START,
    [SysEndTime] DATETIME2 GENERATED ALWAYS AS ROW END,
    PERIOD FOR SYSTEM_TIME ([SysStartTime], [SysEndTime])
) WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = [HTHistory].[HabitTasks]));

-- Create HabitCompletions table (NO VERSIONING - immutable log)
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

-- ====================================
-- Create HabitMilestones table WITH HISTORY
-- ====================================
CREATE TABLE [Habit].[HabitMilestones] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [HabitId] UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES [Habit].[Habits]([Id]) ON DELETE CASCADE,
    [Name] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(MAX),
    [Target] INT NOT NULL,
    [Achieved] BIT DEFAULT 0,
    [AchievedDate] DATETIME2,
    [XpReward] INT NOT NULL,
    [Icon] NVARCHAR(100),
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [SysStartTime] DATETIME2 GENERATED ALWAYS AS ROW START,
    [SysEndTime] DATETIME2 GENERATED ALWAYS AS ROW END,
    PERIOD FOR SYSTEM_TIME ([SysStartTime], [SysEndTime])
) WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = [HTHistory].[HabitMilestones]));

-- Create Quests schema (if not exists)
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Quest')
BEGIN
    EXEC('CREATE SCHEMA [Quest]');
END

-- ====================================
-- Create Quests table WITH HISTORY
-- ====================================
CREATE TABLE [Quest].[Quests] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Name] NVARCHAR(200) NOT NULL,
    [Category] NVARCHAR(100) NOT NULL,
    [Difficulty] NVARCHAR(50) NOT NULL,
    [Xp] INT NOT NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
    [Icon] NVARCHAR(100),
    [Description] NVARCHAR(MAX),
    [Progress] INT DEFAULT 0,
    [CompletionRate] INT DEFAULT 0,
    [Notes] NVARCHAR(MAX),
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [SysStartTime] DATETIME2 GENERATED ALWAYS AS ROW START,
    [SysEndTime] DATETIME2 GENERATED ALWAYS AS ROW END,
    PERIOD FOR SYSTEM_TIME ([SysStartTime], [SysEndTime])
) WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = [HTHistory].[Quests]));

-- ====================================
-- Create QuestChecklistTasks table WITH HISTORY
-- ====================================
CREATE TABLE [Quest].[QuestChecklistTasks] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [QuestId] UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES [Quest].[Quests]([Id]) ON DELETE CASCADE,
    [Title] NVARCHAR(200) NOT NULL,
    [Done] BIT DEFAULT 0,
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [SysStartTime] DATETIME2 GENERATED ALWAYS AS ROW START,
    [SysEndTime] DATETIME2 GENERATED ALWAYS AS ROW END,
    PERIOD FOR SYSTEM_TIME ([SysStartTime], [SysEndTime])
) WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = [HTHistory].[QuestChecklistTasks]));

-- Create QuestCalendarLog table (NO VERSIONING - immutable log)
CREATE TABLE [Quest].[QuestCalendarLog] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [QuestId] UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES [Quest].[Quests]([Id]) ON DELETE CASCADE,
    [LogDate] DATETIME2 NOT NULL,
    [Completed] BIT NOT NULL DEFAULT 0,
    [Notes] NVARCHAR(MAX),
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
```

### Step 4: Create/Update Stored Procedures

See **BACKEND_REQUIREMENTS.md** for complete SP code.

---

## 📋 SUMMARY TABLE

| Action | Table | Data Loss | Downtime |
|--------|-------|-----------|----------|
| **UPDATE** | `Habit.Habits` | ❌ NO | ~1 sec |
| **UPDATE** | `Habit.HabitProgress` | ❌ NO | ~1 sec |
| **CREATE** | `Habit.HabitTasks` | N/A | ~1 sec |
| **CREATE** | `Habit.HabitCompletions` | N/A | ~1 sec |
| **CREATE** | `Habit.HabitMilestones` | N/A | ~1 sec |
| **CREATE** | `Quest.Quests` | N/A | ~1 sec |
| **CREATE** | `Quest.QuestChecklistTasks` | N/A | ~1 sec |
| **CREATE** | `Quest.QuestCalendarLog` | N/A | ~1 sec |

---

## ❌ DO NOT DELETE

**NEVER delete these tables:**
- `Habit.Habits` - Contains user data ⛔
- `Habit.HabitProgress` - Contains progress/stats ⛔

---

## 📊 System Versioning - Query History

Tables with system versioning automatically track all changes. Query history from `[HTHistory]` schema like this:

### Query Task History
```sql
-- See all changes to a specific task
SELECT 
    Id,
    HabitId,
    Name,
    Completed,
    CompletedDate,
    SysStartTime,
    SysEndTime
FROM [HTHistory].[HabitTasks]
WHERE Id = 'YOUR_TASK_ID'
ORDER BY SysStartTime DESC;
```

### Query Milestone Achievement History
```sql
-- Track when milestones were achieved
SELECT 
    Id,
    HabitId,
    Name,
    Achieved,
    AchievedDate,
    SysStartTime,
    SysEndTime
FROM [HTHistory].[HabitMilestones]
WHERE HabitId = 'YOUR_HABIT_ID'
ORDER BY SysStartTime DESC;
```

### Query Quest Status Changes
```sql
-- See all status and progress changes to quests
SELECT 
    Id,
    Name,
    Status,
    Progress,
    SysStartTime,
    SysEndTime
FROM [HTHistory].[Quests]
WHERE Id = 'YOUR_QUEST_ID'
ORDER BY SysStartTime DESC;
```

### Query Changes in a Date Range
```sql
-- Get quest checklist changes between two dates
SELECT 
    Id,
    QuestId,
    Title,
    Done,
    SysStartTime,
    SysEndTime
FROM [HTHistory].[QuestChecklistTasks]
WHERE QuestId = 'YOUR_QUEST_ID'
    AND SysStartTime >= '2026-06-10 00:00:00' 
    AND SysStartTime <= '2026-06-15 23:59:59'
ORDER BY SysStartTime DESC;
```

---

## 📋 VERSIONING SUMMARY

| Table | Versioning | History Table | Best For |
|-------|------------|---------------|----------|
| `HabitTasks` | ✅ YES | `[HTHistory].[HabitTasks]` | Track task completion changes |
| `HabitCompletions` | ❌ NO | N/A | Immutable log (each record is final) |
| `HabitMilestones` | ✅ YES | `[HTHistory].[HabitMilestones]` | Track achievement dates/status changes |
| `Quests` | ✅ YES | `[HTHistory].[Quests]` | Track progress & status changes |
| `QuestChecklistTasks` | ✅ YES | `[HTHistory].[QuestChecklistTasks]` | Track checklist item completion |
| `QuestCalendarLog` | ❌ NO | N/A | Immutable log (each record is final) |

---

1. **Run migrations in a test database first** if possible
2. **Backup before running** on production
3. **All new tables use FOREIGN KEY constraints** - data integrity enforced
4. **Existing stored procedures will need updates** to use new columns
5. **Update API DTOs** to include new fields

---

## QUICK COPY-PASTE MIGRATION

If you want to run everything at once:

```sql
-- STEP 1: Update existing tables
ALTER TABLE [Habit].[Habits] ADD
    [Subtitle] NVARCHAR(250),
    [Category] NVARCHAR(50) NOT NULL DEFAULT 'custom',
    [CustomCategory] NVARCHAR(100),
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'active',
    [EndDt] DATETIME2,
    [Icon] NVARCHAR(100),
    [PrimaryColor] VARCHAR(7) DEFAULT '#d4af37',
    [SecondaryColor] VARCHAR(7) DEFAULT '#4dd9ff',
    [XpReward] INT DEFAULT 50,
    [Notes] NVARCHAR(MAX);

ALTER TABLE [Habit].[HabitProgress] ADD
    [LongestStreak] INT DEFAULT 0;

-- STEP 2: Create schema if needed
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Quest')
BEGIN
    EXEC('CREATE SCHEMA [Quest]');
END

-- STEP 3: Create new tables
CREATE TABLE [Habit].[HabitTasks] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [HabitId] UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES [Habit].[Habits]([Id]) ON DELETE CASCADE,
    [Name] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(MAX),
    [XpReward] INT DEFAULT 10,
    [Completed] BIT DEFAULT 0,
    [CompletedDate] DATETIME2,
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [SysStartTime] DATETIME2 GENERATED ALWAYS AS ROW START,
    [SysEndTime] DATETIME2 GENERATED ALWAYS AS ROW END,
    PERIOD FOR SYSTEM_TIME ([SysStartTime], [SysEndTime])
) WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = [HTHistory].[HabitTasks]));

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

CREATE TABLE [Habit].[HabitMilestones] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [HabitId] UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES [Habit].[Habits]([Id]) ON DELETE CASCADE,
    [Name] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(MAX),
    [Target] INT NOT NULL,
    [Achieved] BIT DEFAULT 0,
    [AchievedDate] DATETIME2,
    [XpReward] INT NOT NULL,
    [Icon] NVARCHAR(100),
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [SysStartTime] DATETIME2 GENERATED ALWAYS AS ROW START,
    [SysEndTime] DATETIME2 GENERATED ALWAYS AS ROW END,
    PERIOD FOR SYSTEM_TIME ([SysStartTime], [SysEndTime])
) WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = [HTHistory].[HabitMilestones]));

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Quest')
BEGIN
    EXEC('CREATE SCHEMA [Quest]');
END

CREATE TABLE [Quest].[Quests] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Name] NVARCHAR(200) NOT NULL,
    [Category] NVARCHAR(100) NOT NULL,
    [Difficulty] NVARCHAR(50) NOT NULL,
    [Xp] INT NOT NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT 'Active',
    [Icon] NVARCHAR(100),
    [Description] NVARCHAR(MAX),
    [Progress] INT DEFAULT 0,
    [CompletionRate] INT DEFAULT 0,
    [Notes] NVARCHAR(MAX),
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [SysStartTime] DATETIME2 GENERATED ALWAYS AS ROW START,
    [SysEndTime] DATETIME2 GENERATED ALWAYS AS ROW END,
    PERIOD FOR SYSTEM_TIME ([SysStartTime], [SysEndTime])
) WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = [HTHistory].[Quests]));

CREATE TABLE [Quest].[QuestChecklistTasks] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [QuestId] UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES [Quest].[Quests]([Id]) ON DELETE CASCADE,
    [Title] NVARCHAR(200) NOT NULL,
    [Done] BIT DEFAULT 0,
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [SysStartTime] DATETIME2 GENERATED ALWAYS AS ROW START,
    [SysEndTime] DATETIME2 GENERATED ALWAYS AS ROW END,
    PERIOD FOR SYSTEM_TIME ([SysStartTime], [SysEndTime])
) WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = [HTHistory].[QuestChecklistTasks]));

CREATE TABLE [Quest].[QuestCalendarLog] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [QuestId] UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES [Quest].[Quests]([Id]) ON DELETE CASCADE,
    [LogDate] DATETIME2 NOT NULL,
    [Completed] BIT NOT NULL DEFAULT 0,
    [Notes] NVARCHAR(MAX),
    [CreatedDt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
```

Just paste this into SQL Server Management Studio and run it! ✅

