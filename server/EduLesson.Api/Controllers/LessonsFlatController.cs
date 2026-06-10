using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduLesson.Api.Data;
using EduLesson.Api.Models;

namespace EduLesson.Api.Controllers;

[ApiController]
[Route("api/lessons")]
public class LessonsFlatController : ControllerBase
{
    private readonly AppDbContext _db;
    public LessonsFlatController(AppDbContext db) { _db = db; }

    [HttpGet]
    public async Task<ActionResult<List<Lesson>>> GetAll([FromQuery] int? courseId)
    {
        var q = _db.Lessons.AsQueryable();
        if (courseId.HasValue) q = q.Where(l => l.CourseId == courseId.Value);
        return await q.OrderBy(l => l.OrderIndex).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Lesson>> Get(int id)
    {
        var l = await _db.Lessons.FindAsync(id);
        if (l == null) return NotFound();
        return l;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var l = await _db.Lessons.FindAsync(id);
        if (l == null) return NotFound();
        _db.Lessons.Remove(l);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
