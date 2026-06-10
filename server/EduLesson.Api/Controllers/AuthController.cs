using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EduLesson.Api.Data;
using EduLesson.Api.Models;
using System.Security.Cryptography;
using System.Text;

namespace EduLesson.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    public AuthController(AppDbContext db) { _db = db; }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
    {
        if (await _db.Users.AnyAsync(u => u.Email == req.Email))
            return BadRequest("Email вже зареєстровано");
        var user = new User
        {
            Email = req.Email,
            Password = HashPw(req.Password),
            Name = req.Name,
            Role = "student",
            CreatedAt = DateTime.UtcNow
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return Ok(new AuthResponse(user.Id, user.Email, user.Name, user.Role, GenToken(user)));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (user == null || user.Password != HashPw(req.Password))
            return BadRequest("Невірний email або пароль");
        return Ok(new AuthResponse(user.Id, user.Email, user.Name, user.Role, GenToken(user)));
    }

    private static string HashPw(string pw)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(pw));
        return Convert.ToHexString(bytes).ToLower();
    }

    private static string GenToken(User u) => Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
}
