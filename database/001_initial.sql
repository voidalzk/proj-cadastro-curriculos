IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261002023508_InitialCreate'
)
BEGIN
    CREATE TABLE [Candidates] (
        [Id] uniqueidentifier NOT NULL,
        [FullName] nvarchar(150) NOT NULL,
        [Email] nvarchar(254) NOT NULL,
        [Phone] nvarchar(30) NULL,
        [InterestArea] nvarchar(150) NULL,
        [ProfessionalSummary] nvarchar(3000) NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_Candidates] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261002023508_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Candidates_CreatedAt] ON [Candidates] ([CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261002023508_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261002023508_InitialCreate', N'10.0.12');
END;

COMMIT;
GO
