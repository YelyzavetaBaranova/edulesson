using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduLesson.Api.Data;
using EduLesson.Api.Models;

namespace EduLesson.Api.Controllers;

[ApiController]
[Route("api")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    public UsersController(AppDbContext db) { _db = db; }

    [HttpGet("users")]
    public async Task<ActionResult<List<object>>> GetAll([FromQuery] string? email)
    {
        var q = _db.Users.AsQueryable();
        if (!string.IsNullOrEmpty(email))
            q = q.Where(u => u.Email == email);
        var result = await q.Select(u => new { u.Id, u.Email, u.Name, u.Role, u.CreatedAt }).ToListAsync();
        return Ok(result);
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var u = await _db.Users.FindAsync(id);
        if (u == null) return NotFound();
        _db.Users.Remove(u);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
