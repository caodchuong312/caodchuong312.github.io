---
title: Azure Functions
author: Adithya Vijay
date: 2022-10-14 16:30:00 +0550
categories: [Blogging, Programming]
tags: [development programming cloud azure functions]     # TAG names should always be lowercase
---

## Introduction
Azure function is an easy way to build the applications you need using simple serverless functions that scale automatically based to meet demand. No need to worry about infrastructure or provisioning servers. Azure functions provides as many or as few compute resources as need to meet the applications demand. A function is invoked using a trigger. Triggers have associated data, which is often provided as the payload of the function.
Some of the Azure Functions triggers are:
1. Http Trigger
2. Timer Trigger
3. Queue Trigger
3. Blob Trigger

## Azure Durable Functions
Durable functions is an extension of Auzre Functions that lets us write stateful functions (long running) in a serverless environment. Durable functions help solve many of the problems due to the stateless nature of functions.

### Serverless: (Why durable functions?)
It is an abstraction of servers. There are real servers behind the scene that are powering serverless.
A developer using serverless function can just focus on their code - there are no distractions around server management, availability etc.
Serverless is event driven. It is only spun up when an event triggers the functions, it does it's job and then spin back down.
With serverless, no infrastructure management, auto-scale based on workload, and no wasted resources.

FaaS (Functions-as-a-Service) is at the center of serverless.
- Single responsibility
- Short lived (Functions don't stick around when finished executing)
- Stateless (Functions don't hold any state and don't rely on the state of any other process)
- Event driven & scalable (Functions respond to predefined events)

If the task the Azure function has to perform is not short lived, simple, and stateless, that is when we move to durable functions.

### Introducing Durable Functions
Durable functions is a free open source framework for azure functions that allows us to:
- Write long-running orchestrations as a single function while maintaining state for all the calls that need to happen while still running in a serverless wasy.
- Simplify complex transactions and coordination (Manage End to End flow). We can easily call function from another functions, synchronously or asynchronously.

### Components
1. **Starter Functions** (What Trigger's off this long running process) eg:- Http trigger, Queue trigger etc
- A trigger which will start off the orchestrations
2. **Orchestrator Function** (It is the heart of the durable function)
- Coordinates activities - We put the orchestration logic here.
3. **Activity Function**
- Performs individual tasks/work. We can run these in parallel, sequentially etc.

Example of an orchestrator function
```
// calls functions in sequence
public static async Task<object> Run(DurableOrchestrationContext ctx) // Orchestrator Function
{
    try
    {
        // passing data sequentially one after the other.
        var x = await ctx.CallFunctionAsync("F1"); // Activity Function
        var y = await ctx.CallFunctionAsync("F2", x); // Activity Function
        return await ctx.CallFunctionAsync("F3", y); // Activity Function
    }
    catch (Exception)
    {
        // global error handling/compensation goes here.
    }
}
```

// A sample orchestration
```
var outputs = new List<string>();
outputs.Add(await context.CallActivityAsync)<string>("SayHello", ".NET"));
return outputs;
```

What happens behind the scenes:
- When somebody triggers the starter function, it calls the orchestrator function
- Will look in the Execution History whether the activity function was already called and if not will execute it.
- Orchestrator function completes and scales back to zero.
- Now Activity function wakes up and executes it's job and lets Orchestrator know work is done.
- When orchestrator function wakes up, it will start from the beginning (not from where it left). It calls the activity function in step 2 again but before that goes to the execution history and checks if it was already done. It is returned as already done, so it skips the activity function an returns the output.

We have Execution History (Has a history table)
History Table
1. Orchestrator Started
2. Execution Started
3. Task Scheduled, SayHello, .NET
4. Orchestrator Completed
5. Execution Completed, ["Hello .NET"]
6. Orchestrator Completed

### Orchestrator Constraints
- Orchestrator code must be deterministic.
- Never use random numbers, DateTime.UtcNow, Guid.NewGuid() etc. But we can use DurableOrchestrationContext.CurrentUtcDateTime
- Don't write infinite loops. Use DurableOrchestrationContext.ContinueAsNew()
- Never do I/O directly in orchestrator. We can Do I/O in activity functions

### Monitoring and Management
- Use Azure App Insights to monitor running instances and health.
- Function App also exposes HTTP API for management (status, update, terminate)
- Version your durable function consciously.
    - Do nothing
    - Wait for orchestrator to drain
    - Side-by-side deployment (Update the name of your task hub on deployment)
