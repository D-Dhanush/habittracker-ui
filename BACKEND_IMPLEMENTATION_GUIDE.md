# Backend Implementation Guide - .NET

**Objective:** Implement all DTOs, Services, Controllers, and Mapper to connect Angular frontend to SQL Server database via stored procedures.

**Framework:** ASP.NET Core with Dapper ORM
**Architecture Pattern:** Clean Architecture with Mapper layer for DTO conversion
**Database:** SQL Server (stored procedures already created - see BACKEND_REQUIREMENTS.md)

---

## 1. PROJECT STRUCTURE

Create the following folder structure in your backend project:

```
HabitTrackerApi/
├── Controllers/
│   ├── HabitController.cs
│   └── QuestController.cs
├── Services/
│   ├── Interfaces/
│   │   ├── IHabitService.cs
│   │   └── IQuestService.cs
│   ├── HabitService.cs
│   └── QuestService.cs
├── DataAccess/
│   ├── IHabitDataAccess.cs
│   ├── IQuestDataAccess.cs
│   ├── HabitDataAccess.cs (Dapper repository for stored procedure calls)
│   └── QuestDataAccess.cs (Dapper repository for stored procedure calls)
├── DTOs/
│   ├── Input/
│   │   ├── HabitInputDto.cs
│   │   ├── HabitUpdateDto.cs
│   │   ├── HabitCompletionDto.cs
│   │   ├── HabitTaskDto.cs
│   │   ├── HabitTaskUpdateDto.cs
│   │   ├── QuestInputDto.cs
│   │   ├── QuestUpdateDto.cs
│   │   ├── ChecklistTaskDto.cs
│   │   ├── ChecklistTaskUpdateDto.cs
│   │   ├── QuestLogDto.cs
│   │   └── UpdateProgressDto.cs
│   ├── Output/
│   │   ├── HabitDto.cs (full habit with tasks, milestones, progress)
│   │   ├── HabitProgressDto.cs
│   │   ├── HabitTaskDto.cs (output version with all fields)
│   │   ├── HabitMilestoneDto.cs
│   │   ├── HabitCompletionDto.cs (output version)
│   │   ├── HabitStatsDto.cs
│   │   ├── QuestDto.cs (full quest with checklist)
│   │   ├── QuestChecklistTaskDto.cs
│   │   ├── QuestCalendarLogDto.cs
│   │   └── QuestProgressDto.cs
│   └── Database/
│       └── Internal database row classes for Dapper mapping (DbHabitRow, DbQuestRow, etc.)
├── Mappers/
│   ├── HabitMapperProfile.cs (AutoMapper profile)
│   ├── QuestMapperProfile.cs (AutoMapper profile)
│   ├── IHabitMapper.cs (interface for custom mapping logic)
│   ├── IQuestMapper.cs
│   ├── HabitMapper.cs (custom mapper for complex conversions)
│   └── QuestMapper.cs
└── Program.cs (DI registration)
```

---

## 2. DTO DEFINITIONS

**Reference File:** BACKEND_REQUIREMENTS.md (Section 4 - REQUIRED INPUT DTOs)

### INPUT DTOs (User sends these to API)

Use exact definitions from BACKEND_REQUIREMENTS.md:
- `HabitInputDto` - Create new habit (11 properties)
- `HabitUpdateDto` - Update habit (12 properties)
- `HabitCompletionDto` - Record completion (3 properties)
- `HabitTaskDto` - Add task (3 properties)
- `HabitTaskUpdateDto` - Update task (4 properties)
- `QuestInputDto` - Create quest (7 properties)
- `QuestUpdateDto` - Update quest (8 properties)
- `ChecklistTaskDto` - Add checklist item (1 property)
- `ChecklistTaskUpdateDto` - Update checklist item (2 properties)
- `QuestLogDto` - Log quest progress (3 properties)
- `UpdateProgressDto` - Update progress percentage (1 property)

**File:** Create individual files in `DTOs/Input/` folder with `public class [ClassName]` definitions.

---

### OUTPUT DTOs (API returns these to frontend)

**HabitDto.cs** - Full habit response
```csharp
public class HabitDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Subtitle { get; set; }
    public string Description { get; set; }
    public string Category { get; set; }
    public string CustomCategory { get; set; }
    public string Status { get; set; } // 'active', 'paused', 'completed', 'archived'
    public string Frequency { get; set; }
    public DateTime StartDt { get; set; }
    public DateTime? EndDt { get; set; }
    public int? TargetOccurrencesPerPeriod { get; set; }
    public TimeSpan? ReminderTimeUtc { get; set; }
    public string Icon { get; set; }
    public string PrimaryColor { get; set; }
    public string SecondaryColor { get; set; }
    public int XpReward { get; set; }
    public List<string> Tags { get; set; }
    public string Notes { get; set; }
    public bool IsActive { get; set; }
    
    // Related data (populated by service from multi-result-set SP)
    public HabitProgressDto Progress { get; set; }
    public List<HabitTaskDto> Tasks { get; set; }
    public List<HabitMilestoneDto> Milestones { get; set; }
    public List<HabitCompletionDto> RecentCompletions { get; set; }
    
    public DateTime CreatedDt { get; set; }
    public DateTime UpdatedDt { get; set; }
}
```

**HabitProgressDto.cs** - Progress tracking
```csharp
public class HabitProgressDto
{
    public Guid Id { get; set; }
    public Guid HabitId { get; set; }
    public int CurrentLevel { get; set; }
    public int CurrentXP { get; set; }
    public int Streak { get; set; }
    public int LongestStreak { get; set; }
    public int TotalCompletions { get; set; }
    public DateTime? LastCompletionDate { get; set; }
}
```

**HabitTaskDto.cs** (Output)
```csharp
public class HabitTaskDto
{
    public Guid Id { get; set; }
    public Guid HabitId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public int XpReward { get; set; }
    public bool Completed { get; set; }
    public DateTime? CompletedDate { get; set; }
    public DateTime CreatedDt { get; set; }
    public DateTime UpdatedDt { get; set; }
}
```

**HabitMilestoneDto.cs**
```csharp
public class HabitMilestoneDto
{
    public Guid Id { get; set; }
    public Guid HabitId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public int Target { get; set; }
    public bool Achieved { get; set; }
    public DateTime? AchievedDate { get; set; }
    public int XpReward { get; set; }
    public string Icon { get; set; }
    public DateTime CreatedDt { get; set; }
}
```

**HabitCompletionDto.cs** (Output)
```csharp
public class HabitCompletionDto
{
    public Guid Id { get; set; }
    public Guid HabitId { get; set; }
    public DateTime CompletionDate { get; set; }
    public bool Completed { get; set; }
    public int XpEarned { get; set; }
    public string Notes { get; set; }
    public DateTime CreatedDt { get; set; }
}
```

**HabitStatsDto.cs**
```csharp
public class HabitStatsDto
{
    public int TotalHabits { get; set; }
    public int ActiveHabits { get; set; }
    public int TotalXpEarned { get; set; }
    public int LongestStreak { get; set; }
    public int CompletedToday { get; set; }
}
```

**QuestDto.cs** - Full quest response
```csharp
public class QuestDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Category { get; set; }
    public string Difficulty { get; set; } // 'Easy', 'Medium', 'Hard'
    public int Xp { get; set; }
    public string Status { get; set; } // 'Active', 'Paused', 'Completed'
    public int Progress { get; set; }
    public int CompletionRate { get; set; }
    public string Icon { get; set; }
    public string Description { get; set; }
    public string Notes { get; set; }
    
    // Related data
    public List<QuestChecklistTaskDto> ChecklistTasks { get; set; }
    public List<QuestCalendarLogDto> CalendarLog { get; set; }
    
    public DateTime CreatedDt { get; set; }
    public DateTime UpdatedDt { get; set; }
}
```

**QuestChecklistTaskDto.cs**
```csharp
public class QuestChecklistTaskDto
{
    public Guid Id { get; set; }
    public Guid QuestId { get; set; }
    public string Title { get; set; }
    public bool Done { get; set; }
    public DateTime CreatedDt { get; set; }
}
```

**QuestCalendarLogDto.cs**
```csharp
public class QuestCalendarLogDto
{
    public Guid Id { get; set; }
    public Guid QuestId { get; set; }
    public DateTime LogDate { get; set; }
    public bool Completed { get; set; }
    public string Notes { get; set; }
    public DateTime CreatedDt { get; set; }
}
```

**File locations:** Create individual files in `DTOs/Output/` folder.

---

## 3. DATABASE ROW CLASSES (for Dapper mapping)

**Purpose:** Internal classes that map directly to stored procedure result sets. **NOT exposed to frontend.**

### DbHabitRow.cs (in DTOs/Database/)
```csharp
internal class DbHabitRow
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Subtitle { get; set; }
    public string Description { get; set; }
    public string Category { get; set; }
    public string CustomCategory { get; set; }
    public string Status { get; set; }
    public string Frequency { get; set; }
    public DateTime StartDt { get; set; }
    public DateTime? EndDt { get; set; }
    public int? TargetOccurrencesPerPeriod { get; set; }
    public TimeSpan? ReminderTimeUtc { get; set; }
    public string Icon { get; set; }
    public string PrimaryColor { get; set; }
    public string SecondaryColor { get; set; }
    public int XpReward { get; set; }
    public string Tags { get; set; } // JSON string from DB
    public string Notes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDt { get; set; }
    public DateTime UpdatedDt { get; set; }
}

internal class DbHabitProgressRow
{
    public Guid Id { get; set; }
    public Guid HabitId { get; set; }
    public int CurrentLevel { get; set; }
    public int CurrentXP { get; set; }
    public int Streak { get; set; }
    public int LongestStreak { get; set; }
    public int TotalCompletions { get; set; }
    public DateTime? LastCompletionDate { get; set; }
}

internal class DbHabitTaskRow
{
    public Guid Id { get; set; }
    public Guid HabitId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public int XpReward { get; set; }
    public bool Completed { get; set; }
    public DateTime? CompletedDate { get; set; }
    public DateTime CreatedDt { get; set; }
    public DateTime UpdatedDt { get; set; }
}

internal class DbHabitMilestoneRow
{
    public Guid Id { get; set; }
    public Guid HabitId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public int Target { get; set; }
    public bool Achieved { get; set; }
    public DateTime? AchievedDate { get; set; }
    public int XpReward { get; set; }
    public string Icon { get; set; }
    public DateTime CreatedDt { get; set; }
}

internal class DbHabitCompletionRow
{
    public Guid Id { get; set; }
    public Guid HabitId { get; set; }
    public DateTime CompletionDate { get; set; }
    public bool Completed { get; set; }
    public int XpEarned { get; set; }
    public string Notes { get; set; }
    public DateTime CreatedDt { get; set; }
}

internal class DbHabitStatsRow
{
    public int TotalHabits { get; set; }
    public int ActiveHabits { get; set; }
    public int TotalXpEarned { get; set; }
    public int LongestStreak { get; set; }
    public int CompletedToday { get; set; }
}
```

**Similar classes for Quest:** `DbQuestRow`, `DbQuestChecklistTaskRow`, `DbQuestCalendarLogRow`

---

## 4. MAPPER LAYER (Clean Architecture)

### Purpose
Convert between database rows and DTOs. Centralizes conversion logic (JSON deserialization, type conversion, null handling).

### IHabitMapper.cs (interface)
```csharp
namespace HabitTrackerApi.Mappers;

public interface IHabitMapper
{
    HabitDto MapToDto(DbHabitRow dbRow, DbHabitProgressRow progress, 
        IEnumerable<DbHabitTaskRow> tasks, IEnumerable<DbHabitMilestoneRow> milestones, 
        IEnumerable<DbHabitCompletionRow> completions);
    
    HabitProgressDto MapProgressToDto(DbHabitProgressRow row);
    HabitTaskDto MapTaskToDto(DbHabitTaskRow row);
    HabitMilestoneDto MapMilestoneToDto(DbHabitMilestoneRow row);
    HabitCompletionDto MapCompletionToDto(DbHabitCompletionRow row);
    HabitStatsDto MapStatsToDto(DbHabitStatsRow row);
}
```

### HabitMapper.cs (implementation)
```csharp
using System.Text.Json;
using HabitTrackerApi.DTOs.Output;
using HabitTrackerApi.DTOs.Database;

namespace HabitTrackerApi.Mappers;

public class HabitMapper : IHabitMapper
{
    public HabitDto MapToDto(DbHabitRow dbRow, DbHabitProgressRow progress,
        IEnumerable<DbHabitTaskRow> tasks, IEnumerable<DbHabitMilestoneRow> milestones,
        IEnumerable<DbHabitCompletionRow> completions)
    {
        if (dbRow is null) return null;

        return new HabitDto
        {
            Id = dbRow.Id,
            Name = dbRow.Name ?? string.Empty,
            Subtitle = dbRow.Subtitle,
            Description = dbRow.Description,
            Category = dbRow.Category,
            CustomCategory = dbRow.CustomCategory,
            Status = dbRow.Status,
            Frequency = dbRow.Frequency,
            StartDt = dbRow.StartDt,
            EndDt = dbRow.EndDt,
            TargetOccurrencesPerPeriod = dbRow.TargetOccurrencesPerPeriod,
            ReminderTimeUtc = dbRow.ReminderTimeUtc,
            Icon = dbRow.Icon,
            PrimaryColor = dbRow.PrimaryColor,
            SecondaryColor = dbRow.SecondaryColor,
            XpReward = dbRow.XpReward,
            Tags = DeserializeTags(dbRow.Tags),
            Notes = dbRow.Notes,
            IsActive = dbRow.IsActive,
            Progress = progress is not null ? MapProgressToDto(progress) : null,
            Tasks = tasks?.Select(MapTaskToDto).ToList() ?? new List<HabitTaskDto>(),
            Milestones = milestones?.Select(MapMilestoneToDto).ToList() ?? new List<HabitMilestoneDto>(),
            RecentCompletions = completions?.Select(MapCompletionToDto).ToList() ?? new List<HabitCompletionDto>(),
            CreatedDt = dbRow.CreatedDt,
            UpdatedDt = dbRow.UpdatedDt
        };
    }

    public HabitProgressDto MapProgressToDto(DbHabitProgressRow row)
    {
        if (row is null) return null;

        return new HabitProgressDto
        {
            Id = row.Id,
            HabitId = row.HabitId,
            CurrentLevel = row.CurrentLevel,
            CurrentXP = row.CurrentXP,
            Streak = row.Streak,
            LongestStreak = row.LongestStreak,
            TotalCompletions = row.TotalCompletions,
            LastCompletionDate = row.LastCompletionDate
        };
    }

    public HabitTaskDto MapTaskToDto(DbHabitTaskRow row)
    {
        if (row is null) return null;

        return new HabitTaskDto
        {
            Id = row.Id,
            HabitId = row.HabitId,
            Name = row.Name,
            Description = row.Description,
            XpReward = row.XpReward,
            Completed = row.Completed,
            CompletedDate = row.CompletedDate,
            CreatedDt = row.CreatedDt,
            UpdatedDt = row.UpdatedDt
        };
    }

    public HabitMilestoneDto MapMilestoneToDto(DbHabitMilestoneRow row)
    {
        if (row is null) return null;

        return new HabitMilestoneDto
        {
            Id = row.Id,
            HabitId = row.HabitId,
            Name = row.Name,
            Description = row.Description,
            Target = row.Target,
            Achieved = row.Achieved,
            AchievedDate = row.AchievedDate,
            XpReward = row.XpReward,
            Icon = row.Icon,
            CreatedDt = row.CreatedDt
        };
    }

    public HabitCompletionDto MapCompletionToDto(DbHabitCompletionRow row)
    {
        if (row is null) return null;

        return new HabitCompletionDto
        {
            Id = row.Id,
            HabitId = row.HabitId,
            CompletionDate = row.CompletionDate,
            Completed = row.Completed,
            XpEarned = row.XpEarned,
            Notes = row.Notes,
            CreatedDt = row.CreatedDt
        };
    }

    public HabitStatsDto MapStatsToDto(DbHabitStatsRow row)
    {
        if (row is null) return null;

        return new HabitStatsDto
        {
            TotalHabits = row.TotalHabits,
            ActiveHabits = row.ActiveHabits,
            TotalXpEarned = row.TotalXpEarned,
            LongestStreak = row.LongestStreak,
            CompletedToday = row.CompletedToday
        };
    }

    private List<string> DeserializeTags(string tagJson)
    {
        if (string.IsNullOrWhiteSpace(tagJson))
            return new List<string>();

        try
        {
            return JsonSerializer.Deserialize<List<string>>(tagJson) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }
}
```

**Create similar:** `IQuestMapper.cs` and `QuestMapper.cs` with same pattern.

---

## 5. DATA ACCESS LAYER (Dapper Repository)

### IHabitDataAccess.cs
```csharp
using HabitTrackerApi.DTOs.Input;
using HabitTrackerApi.DTOs.Database;

namespace HabitTrackerApi.DataAccess;

public interface IHabitDataAccess
{
    Task<DbHabitRow> CreateAsync(HabitInputDto input);
    Task<(DbHabitRow Habit, DbHabitProgressRow Progress, IEnumerable<DbHabitTaskRow> Tasks, 
           IEnumerable<DbHabitMilestoneRow> Milestones, IEnumerable<DbHabitCompletionRow> Completions)> 
        GetByIdAsync(Guid id);
    Task<IEnumerable<DbHabitRow>> GetAllAsync();
    Task<DbHabitRow> UpdateAsync(Guid id, HabitUpdateDto input);
    Task<bool> DeleteAsync(Guid id);
    Task<DbHabitCompletionRow> RecordCompletionAsync(Guid habitId, HabitCompletionDto input);
    Task<DbHabitStatsRow> GetStatsAsync();
    Task<DbHabitTaskRow> AddTaskAsync(Guid habitId, HabitTaskDto input);
    Task<bool> UpdateTaskAsync(Guid habitId, Guid taskId, HabitTaskUpdateDto input);
    Task<bool> DeleteTaskAsync(Guid habitId, Guid taskId);
    Task<DbHabitMilestoneRow> AddMilestoneAsync(Guid habitId, HabitMilestoneDto input);
    Task<bool> AchieveMilestoneAsync(Guid habitId, Guid milestoneId);
}
```

### HabitDataAccess.cs (Implementation with Dapper)
```csharp
using Dapper;
using HabitTrackerApi.DTOs.Input;
using HabitTrackerApi.DTOs.Database;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace HabitTrackerApi.DataAccess;

public class HabitDataAccess : IHabitDataAccess
{
    private readonly string _connectionString;

    public HabitDataAccess(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
    }

    private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

    // CREATE
    public async Task<DbHabitRow> CreateAsync(HabitInputDto input)
    {
        using var conn = CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("@Name", input.Name);
        parameters.Add("@Subtitle", input.Subtitle);
        parameters.Add("@Description", input.Description);
        parameters.Add("@Category", input.Category);
        parameters.Add("@CustomCategory", input.CustomCategory);
        parameters.Add("@Frequency", input.Frequency);
        parameters.Add("@StartDateUtc", input.StartDateUtc);
        parameters.Add("@EndDateUtc", input.EndDateUtc);
        parameters.Add("@TargetOccurrencesPerPeriod", input.TargetOccurrencesPerPeriod);
        parameters.Add("@ReminderTimeUtc", input.ReminderTimeUtc);
        parameters.Add("@Icon", input.Icon);
        parameters.Add("@PrimaryColor", input.PrimaryColor);
        parameters.Add("@SecondaryColor", input.SecondaryColor);
        parameters.Add("@XpReward", input.XpReward);
        parameters.Add("@Tags", input.Tags is null ? null : System.Text.Json.JsonSerializer.Serialize(input.Tags));
        parameters.Add("@Notes", input.Notes);
        parameters.Add("@IsActive", input.IsActive ?? true);

        var result = await conn.QuerySingleAsync<DbHabitRow>(
            "[Habit].[USP_CreateHabit]",
            parameters,
            commandType: CommandType.StoredProcedure);

        return result;
    }

    // READ - Get by ID (multi-result-set SP returns habit + progress + tasks + milestones + completions)
    public async Task<(DbHabitRow Habit, DbHabitProgressRow Progress, IEnumerable<DbHabitTaskRow> Tasks,
        IEnumerable<DbHabitMilestoneRow> Milestones, IEnumerable<DbHabitCompletionRow> Completions)> GetByIdAsync(Guid id)
    {
        using var conn = CreateConnection();
        using var reader = await conn.QueryMultipleAsync(
            "[Habit].[USP_GetHabitById]",
            new { Id = id },
            commandType: CommandType.StoredProcedure);

        var habit = await reader.ReadSingleOrDefaultAsync<DbHabitRow>();
        var progress = await reader.ReadSingleOrDefaultAsync<DbHabitProgressRow>();
        var tasks = await reader.ReadAsync<DbHabitTaskRow>();
        var milestones = await reader.ReadAsync<DbHabitMilestoneRow>();
        var completions = await reader.ReadAsync<DbHabitCompletionRow>();

        return (habit, progress, tasks, milestones, completions);
    }

    // READ - Get all
    public async Task<IEnumerable<DbHabitRow>> GetAllAsync()
    {
        using var conn = CreateConnection();
        var results = await conn.QueryAsync<DbHabitRow>(
            "[Habit].[USP_GetAllHabits]",
            commandType: CommandType.StoredProcedure);

        return results;
    }

    // UPDATE
    public async Task<DbHabitRow> UpdateAsync(Guid id, HabitUpdateDto input)
    {
        using var conn = CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("@Id", id);
        parameters.Add("@Name", input.Name);
        parameters.Add("@Subtitle", input.Subtitle);
        parameters.Add("@Description", input.Description);
        parameters.Add("@Status", input.Status);
        parameters.Add("@Frequency", input.Frequency);
        parameters.Add("@EndDt", input.EndDateUtc);
        parameters.Add("@TargetOccurrencesPerPeriod", input.TargetOccurrencesPerPeriod);
        parameters.Add("@ReminderTimeUtc", input.ReminderTimeUtc);
        parameters.Add("@Icon", input.Icon);
        parameters.Add("@PrimaryColor", input.PrimaryColor);
        parameters.Add("@SecondaryColor", input.SecondaryColor);
        parameters.Add("@XpReward", input.XpReward);
        parameters.Add("@Tags", input.Tags is null ? null : System.Text.Json.JsonSerializer.Serialize(input.Tags));
        parameters.Add("@Notes", input.Notes);

        // This SP returns full habit, not used in update - just execute
        await conn.ExecuteAsync(
            "[Habit].[USP_UpdateHabit]",
            parameters,
            commandType: CommandType.StoredProcedure);

        // Fetch updated habit
        return await conn.QuerySingleAsync<DbHabitRow>(
            "[Habit].[USP_GetHabitById]",
            new { Id = id },
            commandType: CommandType.StoredProcedure);
    }

    // DELETE (soft delete via SP)
    public async Task<bool> DeleteAsync(Guid id)
    {
        using var conn = CreateConnection();
        var result = await conn.ExecuteAsync(
            "[Habit].[USP_DeleteHabit]",
            new { Id = id },
            commandType: CommandType.StoredProcedure);

        return result > 0;
    }

    // Record completion
    public async Task<DbHabitCompletionRow> RecordCompletionAsync(Guid habitId, HabitCompletionDto input)
    {
        using var conn = CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("@HabitId", habitId);
        parameters.Add("@CompletionDate", input.CompletionDate);
        parameters.Add("@XpEarned", input.XpEarned ?? 0);
        parameters.Add("@Notes", input.Notes);

        var result = await conn.QuerySingleAsync<DbHabitCompletionRow>(
            "[Habit].[USP_RecordHabitCompletion]",
            parameters,
            commandType: CommandType.StoredProcedure);

        return result;
    }

    // Get stats
    public async Task<DbHabitStatsRow> GetStatsAsync()
    {
        using var conn = CreateConnection();
        var result = await conn.QuerySingleAsync<DbHabitStatsRow>(
            "[Habit].[USP_GetHabitStats]",
            commandType: CommandType.StoredProcedure);

        return result;
    }

    // Task operations
    public async Task<DbHabitTaskRow> AddTaskAsync(Guid habitId, HabitTaskDto input)
    {
        using var conn = CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("@HabitId", habitId);
        parameters.Add("@Name", input.Name);
        parameters.Add("@Description", input.Description);
        parameters.Add("@XpReward", input.XpReward ?? 10);

        var result = await conn.QuerySingleAsync<DbHabitTaskRow>(
            "[Habit].[USP_AddHabitTask]",
            parameters,
            commandType: CommandType.StoredProcedure);

        return result;
    }

    public async Task<bool> UpdateTaskAsync(Guid habitId, Guid taskId, HabitTaskUpdateDto input)
    {
        using var conn = CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("@TaskId", taskId);
        parameters.Add("@HabitId", habitId);
        parameters.Add("@Name", input.Name);
        parameters.Add("@Description", input.Description);
        parameters.Add("@XpReward", input.XpReward);
        parameters.Add("@Completed", input.Completed);

        var result = await conn.ExecuteAsync(
            "[Habit].[USP_UpdateHabitTask]",
            parameters,
            commandType: CommandType.StoredProcedure);

        return result > 0;
    }

    public async Task<bool> DeleteTaskAsync(Guid habitId, Guid taskId)
    {
        using var conn = CreateConnection();
        var result = await conn.ExecuteAsync(
            "[Habit].[USP_DeleteHabitTask]",
            new { TaskId = taskId, HabitId = habitId },
            commandType: CommandType.StoredProcedure);

        return result > 0;
    }

    // Milestone operations
    public async Task<DbHabitMilestoneRow> AddMilestoneAsync(Guid habitId, HabitMilestoneDto input)
    {
        using var conn = CreateConnection();
        var parameters = new DynamicParameters();
        parameters.Add("@HabitId", habitId);
        parameters.Add("@Name", input.Name);
        parameters.Add("@Description", input.Description);
        parameters.Add("@Target", input.Target);
        parameters.Add("@XpReward", input.XpReward);
        parameters.Add("@Icon", input.Icon);

        var result = await conn.QuerySingleAsync<DbHabitMilestoneRow>(
            "[Habit].[USP_AddHabitMilestone]",
            parameters,
            commandType: CommandType.StoredProcedure);

        return result;
    }

    public async Task<bool> AchieveMilestoneAsync(Guid habitId, Guid milestoneId)
    {
        using var conn = CreateConnection();
        var result = await conn.ExecuteAsync(
            "[Habit].[USP_AchieveMilestone]",
            new { MilestoneId = milestoneId, HabitId = habitId },
            commandType: CommandType.StoredProcedure);

        return result > 0;
    }
}
```

**Create similar:** `IQuestDataAccess.cs` and `QuestDataAccess.cs` using same pattern.

---

## 6. SERVICE LAYER (Business Logic)

### IHabitService.cs
```csharp
using HabitTrackerApi.DTOs.Input;
using HabitTrackerApi.DTOs.Output;

namespace HabitTrackerApi.Services;

public interface IHabitService
{
    Task<HabitDto> CreateAsync(HabitInputDto input);
    Task<HabitDto> GetByIdAsync(Guid id);
    Task<IEnumerable<HabitDto>> GetAllAsync();
    Task<HabitDto> UpdateAsync(Guid id, HabitUpdateDto input);
    Task<bool> DeleteAsync(Guid id);
    Task<HabitCompletionDto> RecordCompletionAsync(Guid habitId, HabitCompletionDto input);
    Task<HabitStatsDto> GetStatsAsync();
    Task<HabitTaskDto> AddTaskAsync(Guid habitId, HabitTaskDto input);
    Task<bool> UpdateTaskAsync(Guid habitId, Guid taskId, HabitTaskUpdateDto input);
    Task<bool> DeleteTaskAsync(Guid habitId, Guid taskId);
    Task<HabitMilestoneDto> AddMilestoneAsync(Guid habitId, HabitMilestoneDto input);
    Task<bool> AchieveMilestoneAsync(Guid habitId, Guid milestoneId);
}
```

### HabitService.cs (Implementation)
```csharp
using HabitTrackerApi.DataAccess;
using HabitTrackerApi.DTOs.Input;
using HabitTrackerApi.DTOs.Output;
using HabitTrackerApi.Mappers;

namespace HabitTrackerApi.Services;

public class HabitService : IHabitService
{
    private readonly IHabitDataAccess _dataAccess;
    private readonly IHabitMapper _mapper;

    public HabitService(IHabitDataAccess dataAccess, IHabitMapper mapper)
    {
        _dataAccess = dataAccess;
        _mapper = mapper;
    }

    public async Task<HabitDto> CreateAsync(HabitInputDto input)
    {
        var dbRow = await _dataAccess.CreateAsync(input);
        return _mapper.MapToDto(dbRow, null, null, null, null);
    }

    public async Task<HabitDto> GetByIdAsync(Guid id)
    {
        var (habit, progress, tasks, milestones, completions) = await _dataAccess.GetByIdAsync(id);
        if (habit is null) return null;

        return _mapper.MapToDto(habit, progress, tasks, milestones, completions);
    }

    public async Task<IEnumerable<HabitDto>> GetAllAsync()
    {
        var dbRows = await _dataAccess.GetAllAsync();
        return dbRows.Select(row => _mapper.MapToDto(row, null, null, null, null));
    }

    public async Task<HabitDto> UpdateAsync(Guid id, HabitUpdateDto input)
    {
        var dbRow = await _dataAccess.UpdateAsync(id, input);
        if (dbRow is null) return null;

        return _mapper.MapToDto(dbRow, null, null, null, null);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        return await _dataAccess.DeleteAsync(id);
    }

    public async Task<HabitCompletionDto> RecordCompletionAsync(Guid habitId, HabitCompletionDto input)
    {
        var dbRow = await _dataAccess.RecordCompletionAsync(habitId, input);
        return _mapper.MapCompletionToDto(dbRow);
    }

    public async Task<HabitStatsDto> GetStatsAsync()
    {
        var dbStats = await _dataAccess.GetStatsAsync();
        return _mapper.MapStatsToDto(dbStats);
    }

    public async Task<HabitTaskDto> AddTaskAsync(Guid habitId, HabitTaskDto input)
    {
        var dbRow = await _dataAccess.AddTaskAsync(habitId, input);
        return _mapper.MapTaskToDto(dbRow);
    }

    public async Task<bool> UpdateTaskAsync(Guid habitId, Guid taskId, HabitTaskUpdateDto input)
    {
        return await _dataAccess.UpdateTaskAsync(habitId, taskId, input);
    }

    public async Task<bool> DeleteTaskAsync(Guid habitId, Guid taskId)
    {
        return await _dataAccess.DeleteTaskAsync(habitId, taskId);
    }

    public async Task<HabitMilestoneDto> AddMilestoneAsync(Guid habitId, HabitMilestoneDto input)
    {
        var dbRow = await _dataAccess.AddMilestoneAsync(habitId, input);
        return _mapper.MapMilestoneToDto(dbRow);
    }

    public async Task<bool> AchieveMilestoneAsync(Guid habitId, Guid milestoneId)
    {
        return await _dataAccess.AchieveMilestoneAsync(habitId, milestoneId);
    }
}
```

**Create similar:** `IQuestService.cs` and `QuestService.cs` using same pattern.

---

## 7. CONTROLLERS

Use exact definitions from **BACKEND_REQUIREMENTS.md Section 3** for both `HabitController` and `QuestController`.

Key points:
- `[ApiController]` and `[Route("api/[controller]")]` attributes
- Inject service interface (e.g., `IHabitService`)
- Check `ModelState.IsValid` for POST/PUT
- Return proper HTTP status codes:
  - `201 Created` for successful POST
  - `200 OK` for successful GET/PUT
  - `204 NoContent` for successful DELETE
  - `400 BadRequest` for validation errors
  - `404 NotFound` when resource doesn't exist

---

## 8. DEPENDENCY INJECTION SETUP (Program.cs)

Add to `Program.cs` in ConfigureServices section:

```csharp
// Register Mappers
builder.Services.AddScoped<IHabitMapper, HabitMapper>();
builder.Services.AddScoped<IQuestMapper, QuestMapper>();

// Register Data Access
builder.Services.AddScoped<IHabitDataAccess, HabitDataAccess>();
builder.Services.AddScoped<IQuestDataAccess, QuestDataAccess>();

// Register Services
builder.Services.AddScoped<IHabitService, HabitService>();
builder.Services.AddScoped<IQuestService, QuestService>();
```

---

## 9. TESTING CHECKLIST

For each endpoint, verify:

✅ **Habit Endpoints:**
- [ ] `POST /api/habit` - Create new habit (all 11 fields)
- [ ] `GET /api/habit` - Get all habits (returns list with progress data)
- [ ] `GET /api/habit/{id}` - Get habit by ID (includes tasks, milestones, recent completions)
- [ ] `PUT /api/habit/{id}` - Update habit (partial updates)
- [ ] `DELETE /api/habit/{id}` - Soft delete (mark inactive)
- [ ] `POST /api/habit/{id}/complete` - Record completion
- [ ] `GET /api/habit/stats/overview` - Get stats
- [ ] `POST /api/habit/{id}/tasks` - Add task
- [ ] `PUT /api/habit/{id}/tasks/{taskId}` - Update task
- [ ] `DELETE /api/habit/{id}/tasks/{taskId}` - Delete task

✅ **Quest Endpoints:**
- [ ] `POST /api/quest` - Create quest
- [ ] `GET /api/quest` - Get all quests
- [ ] `GET /api/quest/{id}` - Get quest with checklist and calendar log
- [ ] `PUT /api/quest/{id}` - Update quest
- [ ] `DELETE /api/quest/{id}` - Soft delete
- [ ] `POST /api/quest/{id}/checklist` - Add checklist task
- [ ] `PUT /api/quest/{id}/checklist/{taskId}` - Update checklist task
- [ ] `POST /api/quest/{id}/log` - Log daily progress
- [ ] `PUT /api/quest/{id}/progress` - Update progress percentage

---

## 10. IMPLEMENTATION SEQUENCE

Execute in this order:

1. **Create all DTO files** (Input + Output + Database classes)
2. **Create Mapper interfaces and implementations**
3. **Create Data Access interfaces and implementations** (with Dapper calls to SPs)
4. **Create Service interfaces and implementations**
5. **Create Controllers** (use service methods)
6. **Register in Program.cs**
7. **Test all endpoints**

---

## KEY ARCHITECTURE BENEFITS

✅ **Clean Separation of Concerns:**
- DTOs for data transfer (Input/Output)
- Database rows for ORM mapping (Internal)
- Mappers for conversion logic
- Services for business logic
- Controllers for HTTP handling
- Data Access for database interaction

✅ **Reusability:**
- Mappers can be tested independently
- Services can be mocked for controller tests
- Data access can be swapped for testing

✅ **Maintainability:**
- JSON serialization in one place (mapper)
- SP parameter mapping in one place (data access)
- Business logic isolated in services
- Easy to add new features

✅ **Type Safety:**
- All DTOs are strongly typed
- Database rows ensure Dapper mapping accuracy
- No string-based lookups

---

## REFERENCE DOCUMENTATION

- **Stored Procedures:** See BACKEND_REQUIREMENTS.md Section 2
- **API Contracts:** See BACKEND_REQUIREMENTS.md Section 3
- **DTO Definitions:** See BACKEND_REQUIREMENTS.md Section 4
- **Database Schema:** See TABLE_MIGRATION_PLAN.md

---

**Status:** Ready for .NET backend agent implementation
**Total Files to Create:** 45+ files (DTOs, Mappers, Data Access, Services, Controllers)
**Estimated Time:** 2-3 hours with experienced .NET developer
