# 🍽️ LunchDrop AI Auto-Order Bot

> An AI-powered LunchDrop automation agent that scrapes the daily menu, understands my nutrition goals, ranks meals using an LLM, and prepares the best order for approval.

---

# Goal

Build an intelligent LunchDrop assistant that:

- Logs into LunchDrop
- Reads the daily menu
- Understands my fitness goals
- Chooses the optimal meal
- Uses Playwright to prepare the order
- Waits for approval before checkout
- Can eventually become fully autonomous

Primary Goal:

> Gain lean weight while minimizing decision fatigue.

---

# User Profile

Name: Nischal

Goals

- Gain weight
- Build muscle
- Eat 900–1200 calorie lunches
- High protein
- Budget conscious
- Works:
    - Office: Monday Wednesday Friday
    - Home: Tuesday Thursday

Current Equipment

- Air fryer
- Blender
- Protein powder
- Creatine
- Walmart+
- LunchDrop

---

# Desired Features

## Daily Workflow

Every morning:

1. Read LunchDrop menu
2. Scrape every restaurant
3. Estimate

- Calories
- Protein
- Carbs
- Fat

4. Compare meals
5. Rank them
6. Pick the best one
7. Modify order if necessary

Example:

- Double chicken
- Extra rice
- No lettuce
- Extra pita

8. Present recommendation
9. Wait for approval
10. Submit order

---

# AI Decision Engine

Prompt Example

```
Goal:
Gain lean weight.

Lunch Target:

1000 Calories
60g Protein

Budget:
$18

Avoid:

Tiny salads
Low protein meals

Prefer:

Chicken
Beef
Rice
Potatoes
Greek food
Mediterranean
Mexican

Rank today's menu.
Choose the best option.
Explain why.
```

---

# Technology Stack

Frontend

- Next.js
- React
- TailwindCSS
- shadcn/ui

Backend

- Node.js
- TypeScript
- Express

Automation

- Playwright

AI

- OpenAI GPT-5.5
- Anthropic Claude
- Local models (optional)

Database

- SQLite
- PostgreSQL (future)

Deployment

- Railway
- Render
- Fly.io
- DigitalOcean VPS

CI/CD

- GitHub Actions

---

# Architecture

```
Phone

↓

Dashboard

↓

Backend API

↓

LLM

↓

Playwright

↓

LunchDrop

↓

Prepared Order

↓

Approval

↓

Submit
```

---

# Project Structure

```
LunchDropBot/

src/
    ai/
    playwright/
    api/
    scoring/
    notifications/
    config/

tests/

.github/
    workflows/

README.md

.env

package.json
```

---

# AI Scoring

Example

Protein

+40

Chicken

+30

Rice

+25

Avocado

+15

Double Protein

+30

Greek

+15

Beef

+30

Salad Only

-40

Tiny Portion

-30

---

# Future Features

## Grocery Assistant

Connect Walmart+

Generate:

Breakfast

Lunch

Dinner

Weekly groceries

Automatically.

---

## Nutrition Tracking

Track

Calories

Protein

Fat

Carbs

Weight

Progress

Weekly averages

---

## Calendar Integration

Office days

↓

Automatically recommend LunchDrop

Home days

↓

Recommend meal prep

---

## Push Notifications

11:00 AM

Today's Best Lunch

Austin Rotisserie

Chicken Plate

Estimated:

1050 Calories

65g Protein

Approve?

---

# Phase 2

Connect

- Apple Health
- Garmin
- Fitbit
- MyFitnessPal
- Cronometer

Adjust meals automatically.

---

# Phase 3

Vision AI

Read menu images.

Estimate calories.

Estimate portion size.

---

# Phase 4

Fully Autonomous Agent

Wake up daily

↓

Check LunchDrop

↓

Analyze menu

↓

Choose meal

↓

Prepare order

↓

Notify user

↓

Submit after approval

---

# GitHub Actions

Used for:

- Tests
- Lint
- Deploy
- Build
- Playwright testing

Not recommended for:

- Daily ordering
- Persistent browser sessions
- Long-running automation

Those should run on:

- Railway
- Render
- VPS
- Docker

---

# Useful Links

## LunchDrop

https://lunchdrop.com/

---

## Playwright

https://playwright.dev/

---

## GitHub Actions

https://docs.github.com/actions

---

## Next.js

https://nextjs.org/

---

## React

https://react.dev/

---

## Tailwind CSS

https://tailwindcss.com/

---

## shadcn/ui

https://ui.shadcn.com/

---

## Railway

https://railway.app/

---

## Render

https://render.com/

---

## Fly.io

https://fly.io/

---

## Docker

https://www.docker.com/

---

## OpenAI API

https://platform.openai.com/

---

## Anthropic API

https://console.anthropic.com/

---

# Long-Term Vision

A personal AI operations agent that automates nutrition decisions based on:

- Goals
- Schedule
- Budget
- Grocery inventory
- LunchDrop
- Walmart+
- Fitness progress
- Weight trends

The user simply sets the goal.

Everything else is handled automatically.