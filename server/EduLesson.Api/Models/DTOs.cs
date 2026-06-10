namespace EduLesson.Api.Models;

public record LoginRequest(string Email, string Password);
public record RegisterRequest(string Email, string Password, string Name);
public record AuthResponse(int Id, string Email, string Name, string Role, string Token);
public record CreateCourseRequest(string Name, string Description);
public record CreateLessonRequest(string Name);
public record UpdateLessonRequest(string Name, string TasksJson);
public record EnrollRequest(int UserId, int CourseId);
public record ProgressRequest(int UserId, int LessonId, string Status);
public record HomeworkRequest(int UserId, int LessonId, int CourseId, string? TasksJson);
public record UpdateHomeworkRequest(string? Status, string? TasksJson);
public record ScheduleRequest(int UserId, int CourseId, string Date, string LessonIdsJson, string? Notes);
public record ActivityLogRequest(int UserId, int LessonId, int CourseId, string? EndTime, int? DurationSeconds);
