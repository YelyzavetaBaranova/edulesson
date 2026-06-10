using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduLesson.Api.Data;
using EduLesson.Api.Models;

namespace EduLesson.Api.Controllers;

[ApiController]
[Route("api/courses/{courseId}/lessons")]
public class LessonsController : ControllerBase
{
    private readonly AppDbContext _db;
    public LessonsController(AppDbContext db) { _db = db; }

    [HttpGet]
    public async Task<ActionResult<List<Lesson>>> GetAll(int courseId)
    {
        return await _db.Lessons.Where(l => l.CourseId == courseId).OrderBy(l => l.OrderIndex).ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Lesson>> Create(int courseId, CreateLessonRequest req)
    {
        var maxOrder = await _db.Lessons.Where(l => l.CourseId == courseId).MaxAsync(l => (int?)l.OrderIndex) ?? -1;
        var l = new Lesson { CourseId = courseId, Name = req.Name, OrderIndex = maxOrder + 1 };
        _db.Lessons.Add(l);
        await _db.SaveChangesAsync();
        return l;
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Lesson>> Update(int courseId, int id, UpdateLessonRequest req)
    {
        var l = await _db.Lessons.FirstOrDefaultAsync(x => x.Id == id && x.CourseId == courseId);
        if (l == null) return NotFound();
        l.Name = req.Name ?? l.Name;
        l.TasksJson = req.TasksJson ?? l.TasksJson;
        await _db.SaveChangesAsync();
        return l;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int courseId, int id)
    {
        var l = await _db.Lessons.FirstOrDefaultAsync(x => x.Id == id && x.CourseId == courseId);
        if (l == null) return NotFound();
        _db.Lessons.Remove(l);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
