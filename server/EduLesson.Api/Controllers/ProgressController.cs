using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduLesson.Api.Data;
using EduLesson.Api.Models;

namespace EduLesson.Api.Controllers;

[ApiController]
[Route("api/progress")]
public class ProgressController : ControllerBase
{
    private readonly AppDbContext _db;
    public ProgressController(AppDbContext db) { _db = db; }

    [HttpGet]
    public async Task<ActionResult<List<Progress>>> GetAll([FromQuery] int? userId, [FromQuery] int? lessonId)
    {
        var q = _db.Progress.AsQueryable();
        if (userId.HasValue) q = q.Where(p => p.UserId == userId.Value);
        if (lessonId.HasValue) q = q.Where(p => p.LessonId == lessonId.Value);
        return await q.ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Progress>> Upsert(ProgressRequest req)
    {
        var p = await _db.Progress.FirstOrDefaultAsync(x => x.UserId == req.UserId && x.LessonId == req.LessonId);
        if (p != null)
        {
            p.Status = req.Status;
            p.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            p = new Progress { UserId = req.UserId, LessonId = req.LessonId, Status = req.Status };
            _db.Progress.Add(p);
        }
        await _db.SaveChangesAsync();
        return p;
    }
}
