using Microsoft.EntityFrameworkCore;
using EduLesson.Api.Models;

namespace EduLesson.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<User> Users => Set<User>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<Progress> Progress => Set<Progress>();
    public DbSet<Homework> Homework => Set<Homework>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<Enrollment>().HasIndex(e => new { e.UserId, e.CourseId }).IsUnique();
        modelBuilder.Entity<Progress>().HasIndex(p => new { p.UserId, p.LessonId }).IsUnique();
    }
}
