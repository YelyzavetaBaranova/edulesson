namespace EduLesson.Api.Models;

public class Homework
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int LessonId { get; set; }
    public int CourseId { get; set; }
    public string TasksJson { get; set; } = "[]";
    public string Status { get; set; } = "todo";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
