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
    public async Task<ActionResult<List<Homework>>> GetAll([FromQuery] int? userId, [FromQuery] int? lessonId)
    {
        var q = _db.Homework.AsQueryable();
        if (userId.HasValue) q = q.Where(h => h.UserId == userId.Value);
        if (lessonId.HasValue) q = q.Where(h => h.LessonId == lessonId.Value);
        return await q.ToListAsync();
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
        var h = new Homework { UserId = req.UserId, LessonId = req.LessonId, TaskId = req.TaskId, Title = req.Title, Status = "todo" };
        _db.Homework.Add(h);
        await _db.SaveChangesAsync();
        return h;
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Homework>> Update(int id)
    {
        var h = await _db.Homework.FindAsync(id);
        if (h == null) return NotFound();
        h.Status = "done";
        await _db.SaveChangesAsync();
        return h;
    }
}
