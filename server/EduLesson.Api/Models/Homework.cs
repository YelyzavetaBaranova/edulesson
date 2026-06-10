namespace EduLesson.Api.Models;

public class Homework
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int LessonId { get; set; }
    public int TaskId { get; set; }
    public string Title { get; set; } = "";
    public string Status { get; set; } = "todo";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
