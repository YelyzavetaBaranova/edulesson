using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduLesson.Api.Data;
using EduLesson.Api.Models;

namespace EduLesson.Api.Controllers;

[ApiController]
[Route("api/activity")]
public class ActivityController : ControllerBase
{
    private readonly AppDbContext _db;
    public ActivityController(AppDbContext db) { _db = db; }

    [HttpGet]
    public async Task<ActionResult<List<ActivityLog>>> GetAll([FromQuery] int? userId, [FromQuery] int? lessonId, [FromQuery] int? courseId)
    {
        var q = _db.ActivityLogs.AsQueryable();
        if (userId.HasValue) q = q.Where(a => a.UserId == userId.Value);
        if (lessonId.HasValue) q = q.Where(a => a.LessonId == lessonId.Value);
        if (courseId.HasValue) q = q.Where(a => a.CourseId == courseId.Value);
        return await q.OrderByDescending(a => a.StartTime).ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<ActivityLog>> Start(ActivityLogRequest req)
    {
        var a = new ActivityLog
        {
            UserId = req.UserId,
            LessonId = req.LessonId,
            CourseId = req.CourseId,
            StartTime = DateTime.UtcNow.ToString("o"),
            SessionDate = DateTime.UtcNow.ToString("yyyy-MM-dd")
        };
        _db.ActivityLogs.Add(a);
        await _db.SaveChangesAsync();
        return a;
    }

    [HttpPut("{id}/stop")]
    public async Task<ActionResult<ActivityLog>> Stop(int id)
    {
        var a = await _db.ActivityLogs.FindAsync(id);
        if (a == null) return NotFound();
        a.EndTime = DateTime.UtcNow.ToString("o");
        if (DateTime.TryParse(a.StartTime, out var start) && DateTime.TryParse(a.EndTime, out var end))
            a.DurationSeconds = (int)(end - start).TotalSeconds;
        await _db.SaveChangesAsync();
        return a;
    }
}
