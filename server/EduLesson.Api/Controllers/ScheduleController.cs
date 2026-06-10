using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduLesson.Api.Data;
using EduLesson.Api.Models;

namespace EduLesson.Api.Controllers;

[ApiController]
[Route("api/schedule")]
public class ScheduleController : ControllerBase
{
    private readonly AppDbContext _db;
    public ScheduleController(AppDbContext db) { _db = db; }

    [HttpGet]
    public async Task<ActionResult<List<Schedule>>> GetAll([FromQuery] int? userId, [FromQuery] int? courseId, [FromQuery] string? date)
    {
        var q = _db.Schedule.AsQueryable();
        if (userId.HasValue) q = q.Where(s => s.UserId == userId.Value);
        if (courseId.HasValue) q = q.Where(s => s.CourseId == courseId.Value);
        if (!string.IsNullOrEmpty(date)) q = q.Where(s => s.Date == date);
        return await q.OrderBy(s => s.Date).ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Schedule>> Create(ScheduleRequest req)
    {
        var s = new Schedule
        {
            UserId = req.UserId,
            CourseId = req.CourseId,
            Date = req.Date,
            LessonIdsJson = req.LessonIdsJson,
            Notes = req.Notes ?? ""
        };
        _db.Schedule.Add(s);
        await _db.SaveChangesAsync();
        return s;
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Schedule>> Update(int id, ScheduleRequest req)
    {
        var s = await _db.Schedule.FindAsync(id);
        if (s == null) return NotFound();
        s.UserId = req.UserId;
        s.CourseId = req.CourseId;
        s.Date = req.Date;
        s.LessonIdsJson = req.LessonIdsJson;
        s.Notes = req.Notes ?? s.Notes;
        await _db.SaveChangesAsync();
        return s;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var s = await _db.Schedule.FindAsync(id);
        if (s == null) return NotFound();
        _db.Schedule.Remove(s);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
