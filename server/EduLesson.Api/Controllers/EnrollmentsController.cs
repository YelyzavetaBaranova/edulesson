using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduLesson.Api.Data;
using EduLesson.Api.Models;

namespace EduLesson.Api.Controllers;

[ApiController]
[Route("api/enrollments")]
public class EnrollmentsController : ControllerBase
{
    private readonly AppDbContext _db;
    public EnrollmentsController(AppDbContext db) { _db = db; }

    [HttpGet]
    public async Task<ActionResult<List<Enrollment>>> GetAll([FromQuery] int? userId, [FromQuery] int? courseId)
    {
        var q = _db.Enrollments.AsQueryable();
        if (userId.HasValue) q = q.Where(e => e.UserId == userId.Value);
        if (courseId.HasValue) q = q.Where(e => e.CourseId == courseId.Value);
        return await q.ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Enrollment>> Create(EnrollRequest req)
    {
        var exists = await _db.Enrollments.AnyAsync(e => e.UserId == req.UserId && e.CourseId == req.CourseId);
        if (exists) return BadRequest("Вже призначено");
        var e = new Enrollment { UserId = req.UserId, CourseId = req.CourseId };
        _db.Enrollments.Add(e);
        await _db.SaveChangesAsync();
        return e;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var e = await _db.Enrollments.FindAsync(id);
        if (e == null) return NotFound();
        _db.Enrollments.Remove(e);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
