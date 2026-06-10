namespace EduLesson.Api.Models;

public class ActivityLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int LessonId { get; set; }
    public int CourseId { get; set; }
    public string StartTime { get; set; } = "";
    public string? EndTime { get; set; }
    public int DurationSeconds { get; set; }
    public string SessionDate { get; set; } = "";
}
