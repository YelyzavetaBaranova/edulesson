FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app
COPY . .
RUN dotnet publish server/EduLesson.Api -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://0.0.0.0:3000
COPY --from=build /app/publish .
COPY index.html js/ css/ assets/ scripts/ ./
EXPOSE 3000
ENTRYPOINT ["dotnet", "EduLesson.Api.dll"]
