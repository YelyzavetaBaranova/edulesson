namespace EduLesson.Api.Models;

public class Lesson
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string Name { get; set; } = "";
    public int OrderIndex { get; set; }
    public string TasksJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
