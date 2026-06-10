using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduLesson.Api.Data;
using EduLesson.Api.Models;

namespace EduLesson.Api.Controllers;

[ApiController]
[Route("api/courses")]
public class CoursesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CoursesController(AppDbContext db) { _db = db; }

    [HttpGet]
    public async Task<ActionResult<List<Course>>> GetAll() => await _db.Courses.ToListAsync();

    [HttpPost]
    public async Task<ActionResult<Course>> Create(CreateCourseRequest req)
    {
        var c = new Course { Name = req.Name, Description = req.Description ?? "" };
        _db.Courses.Add(c);
        await _db.SaveChangesAsync();
        return c;
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Course>> Update(int id, CreateCourseRequest req)
    {
        var c = await _db.Courses.FindAsync(id);
        if (c == null) return NotFound();
        c.Name = req.Name ?? c.Name;
        c.Description = req.Description ?? c.Description;
        await _db.SaveChangesAsync();
        return c;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _db.Courses.FindAsync(id);
        if (c == null) return NotFound();
        var lessons = await _db.Lessons.Where(l => l.CourseId == id).ToListAsync();
        _db.Lessons.RemoveRange(lessons);
        _db.Courses.Remove(c);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
