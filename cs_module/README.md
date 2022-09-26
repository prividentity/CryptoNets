# Private ID C# Sample Application

Powered by Private Identity® - https://private.id

## Prerequisite

Sign up on the waitlist on https://private.id to obtain your apiKey.

## Provide configuration

You have to specify valid API key in the `AppModel.cs` file:

```cs
    private const String ApiKey = "";
```

Without this step you'll be able to compile code but it will not work properly.

## How to run using .NET SDK

- Install [.NET 6.0 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/6.0)
- Run the next command: `dotnet run` in this directory and wait build completion

## How to run using Visual Studio

- Open the `PrivId.Demo.sln` file in Visual Studio 2022 or later
- Build and run (will take time to download all required packages)