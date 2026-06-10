namespace EduLesson.Api.Models;

public class Progress
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int LessonId { get; set; }
    public string Status { get; set; } = "not_started";
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
