namespace EduLesson.Api.Models;

public class Schedule
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int CourseId { get; set; }
    public string Date { get; set; } = "";
    public string LessonIdsJson { get; set; } = "[]";
    public string Notes { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
