using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduLesson.Api.Data;
using EduLesson.Api.Models;

namespace EduLesson.Api.Controllers;

[ApiController]
[Route("api/homework")]
public class HomeworkController : ControllerBase
{
    private readonly AppDbContext _db;
    public HomeworkController(AppDbContext db) { _db = db; }

    [HttpGet]
    public async Task<ActionResult<List<Homework>>> GetAll([FromQuery] int? userId, [FromQuery] int? lessonId, [FromQuery] int? courseId)
    {
        var q = _db.Homework.AsQueryable();
        if (userId.HasValue) q = q.Where(h => h.UserId == userId.Value);
        if (lessonId.HasValue) q = q.Where(h => h.LessonId == lessonId.Value);
        if (courseId.HasValue) q = q.Where(h => h.CourseId == courseId.Value);
        return await q.OrderBy(h => h.LessonId).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Homework>> Get(int id)
    {
        var h = await _db.Homework.FindAsync(id);
        if (h == null) return NotFound();
        return h;
    }

    [HttpPost]
    public async Task<ActionResult<Homework>> Create(HomeworkRequest req)
    {
        var h = new Homework
        {
            UserId = req.UserId,
            LessonId = req.LessonId,
            CourseId = req.CourseId,
            TasksJson = req.TasksJson ?? "[]",
            Status = "todo"
        };
        _db.Homework.Add(h);
        await _db.SaveChangesAsync();
        return h;
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Homework>> Update(int id, UpdateHomeworkRequest req)
    {
        var h = await _db.Homework.FindAsync(id);
        if (h == null) return NotFound();
        if (req.Status != null) h.Status = req.Status;
        if (req.TasksJson != null) h.TasksJson = req.TasksJson;
        h.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return h;
    }
}
