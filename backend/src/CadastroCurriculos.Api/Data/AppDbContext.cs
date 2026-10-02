using CadastroCurriculos.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CadastroCurriculos.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Candidate> Candidates => Set<Candidate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var candidate = modelBuilder.Entity<Candidate>();
        candidate.ToTable("Candidates");
        candidate.HasKey(item => item.Id);
        candidate.Property(item => item.FullName).IsRequired().HasMaxLength(150);
        candidate.Property(item => item.Email).IsRequired().HasMaxLength(254);
        candidate.Property(item => item.Phone).HasMaxLength(30);
        candidate.Property(item => item.InterestArea).HasMaxLength(150);
        candidate.Property(item => item.ProfessionalSummary).HasMaxLength(3000);
        candidate.HasIndex(item => item.CreatedAt);
    }
}
