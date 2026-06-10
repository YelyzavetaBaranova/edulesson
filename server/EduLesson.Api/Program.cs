using Microsoft.EntityFrameworkCore;
using EduLesson.Api.Data;
using EduLesson.Api.Models;
using System.Security.Cryptography;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT");
if (port != null) builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite("Data Source=edulesson.db"));
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // Auto-migrate: if the Homework table lacks TasksJson, rebuild the schema
    try { db.Database.ExecuteSqlRaw("SELECT TasksJson FROM Homework LIMIT 1"); }
    catch { db.Database.EnsureDeleted(); db.Database.EnsureCreated(); }
    if (!db.Database.CanConnect()) db.Database.EnsureCreated();
    if (!db.Users.Any())
    {
        var pw = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes("admin123"))).ToLower();
        db.Users.Add(new User { Email = "admin@edulesson.com", Password = pw, Name = "Admin", Role = "admin" });
        db.SaveChanges();
    }
}

app.UseCors();
app.MapControllers();

// Serve static frontend files — walk up from content root to find index.html
var wwwroot = Environment.GetEnvironmentVariable("EDU_WWWROOT");
if (wwwroot == null)
{
    wwwroot = app.Environment.ContentRootPath;
    while (!File.Exists(Path.Combine(wwwroot, "index.html")))
    {
        var parent = Path.GetDirectoryName(wwwroot);
        if (parent == null || parent == wwwroot) break;
        wwwroot = parent;
    }
}
Console.WriteLine($"Static files root: {wwwroot}");
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(wwwroot),
    ServeUnknownFileTypes = true,
    DefaultContentType = "application/javascript"
});

app.MapFallbackToFile("index.html", new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(wwwroot)
});

app.Run();
