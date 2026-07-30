# RemitIQ Market Service

> **Market Intelligence Microservice for the RemitIQ Ecosystem**
>
> **Version:** 1.0.0
>
> **Status:** Planning

---

# Overview

The **RemitIQ Market Service** is responsible for collecting, storing, analyzing, and exposing foreign exchange market data used throughout the RemitIQ ecosystem.

This service is designed as an independent REST API that provides reliable market intelligence to other applications such as the Web Dashboard and Mobile App.

It is one of the core backend services within the RemitIQ ecosystem and owns all exchange-rate related data.

---

# Purpose

The purpose of this service is to help users make better remittance decisions by providing accurate exchange rate information and market insights.

Rather than moving money, this service provides intelligence that answers questions such as:

* What is the current exchange rate?
* Is today a good day to send money?
* Has the rate improved over the last week?
* When should users receive exchange rate alerts?
* What are historical trends?

---

# Responsibilities

This service is responsible for:

* Collecting exchange rates from external providers
* Storing historical exchange rates
* Maintaining supported currencies
* Calculating exchange rate trends
* Processing exchange rate alerts
* Providing market-related REST APIs
* Supplying market data to other RemitIQ services

---

# Out of Scope

This service **does not** manage:

* User accounts
* Authentication
* Household management
* Budgets
* Remittance transactions
* Analytics based on household spending
* Payment processing
* Money transfers

Those responsibilities belong to other services within the ecosystem.

---

# Architecture

```text
                   External FX Provider
                           │
                           ▼
                 RemitIQ Market Service
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
     PostgreSQL      Trend Engine     Alert Engine
          │
          ▼
       REST API
          │
     ┌────┴─────┐
     ▼          ▼
 Web Client   Mobile Client
```

The Market Service is completely independent.

It owns its own database and communicates only through HTTP APIs.

---

# Technology Stack

| Layer            | Technology     |
| ---------------- | -------------- |
| Runtime          | Node.js        |
| Language         | TypeScript     |
| Framework        | Express.js     |
| ORM              | Prisma         |
| Database         | PostgreSQL     |
| Validation       | Zod            |
| Logging          | Pino           |
| HTTP Client      | Axios          |
| Scheduler        | node-cron      |
| Containerization | Docker         |
| CI/CD            | GitHub Actions |

---

# Why These Technologies?

## Node.js

Provides excellent performance for I/O-heavy applications such as external API integrations.

---

## Express.js

A lightweight framework that gives complete control over REST API design.

---

## TypeScript

Improves maintainability through static typing and better developer tooling.

---

## Prisma

Provides a modern, type-safe ORM with excellent migration support.

---

## PostgreSQL

Reliable relational database capable of efficiently storing historical financial data.

---

## Docker

Ensures identical development, testing, and production environments.

---

## Pino

Fast, structured logging suitable for production systems.

---

## Axios

Simple and reliable HTTP client for consuming external exchange rate APIs.

---

## Zod

Provides runtime validation and type inference for request payloads.

---

# High-Level Features

## Currency Management

Maintain supported currencies.

Examples:

* USD
* EUR
* GBP
* XAF

---

## Exchange Rate Collection

Retrieve exchange rates from external providers on a scheduled basis.

---

## Historical Data

Maintain historical exchange rates for trend analysis.

---

## Trend Analysis

Calculate:

* Daily trends
* Weekly trends
* Monthly trends
* Percentage changes

---

## Exchange Rate Alerts

Evaluate alert rules.

Example:

Notify user when

USD/XAF ≥ 650

---

## Public REST API

Expose exchange rate data to:

* Web application
* Mobile application
* Household Service

---

# Project Structure

```text
remitIQ-market-service/

docs/

src/

tests/

prisma/

.github/

Dockerfile

docker-compose.yml

.env.example

README.md

LICENSE

package.json

tsconfig.json
```

The project follows a modular architecture where every layer has a single responsibility.

---

# Planned Source Structure

```text
src/

config/

controllers/

services/

repositories/

routes/

middlewares/

validators/

clients/

jobs/

types/

utils/

constants/

app.ts

server.ts
```

This structure keeps business logic organized and maintainable.

---

# Database Ownership

This service owns its own PostgreSQL database.

No other service may directly access its tables.

Other services must use the public REST API.

---

# Planned Database Models

The initial models include:

* Currency
* ExchangeRate
* RateHistory
* AlertRule
* AlertEvent

Additional models may be introduced as the application evolves.

---

# API Design

The API follows REST principles.

Example base URL:

```
/api/v1
```

Example endpoints:

```
GET /currencies

GET /rates/latest

GET /rates/history

GET /rates/trends

POST /alerts

PUT /alerts/:id

DELETE /alerts/:id

GET /alerts
```

API versioning ensures backward compatibility for future releases.

---

# Communication

The Market Service communicates with:

## External Services

Exchange rate providers through HTTPS.

## Internal Services

Household Service

Web Application

Mobile Application

Communication format:

* HTTPS
* JSON
* REST

---

# Authentication

The Market Service does not manage users.

Authentication is delegated to the Household Service.

Clients authenticate using JWTs issued by the Household Service.

The Market Service validates incoming tokens before serving protected resources.

---

# Environment Configuration

Configuration is managed through environment variables.

Sensitive information is never committed to Git.

Developers copy:

```
.env.example
```

to

```
.env
```

before running the application.

---

# Docker

Docker is used to provide a consistent execution environment.

Every developer runs the same software versions regardless of operating system.

The application can be started locally using Docker Compose or directly with Node.js during development.

---

# Logging

The application uses structured logging.

Logs are intended to be compatible with centralized logging solutions such as Loki.

Logging levels include:

* info
* warn
* error
* debug

---

# Error Handling

A centralized error handler will ensure consistent API responses.

Errors will include:

* HTTP status code
* Error message
* Validation details (when applicable)
* Correlation ID (future enhancement)

---

# Security

The service will follow security best practices including:

* Helmet security headers
* CORS configuration
* Request validation
* Environment-based configuration
* Parameterized database queries
* Secure logging
* Rate limiting (future enhancement)

---

# Testing Strategy

Testing will include:

* Unit tests
* Integration tests
* API endpoint tests

Automated tests will run in GitHub Actions before deployment.

---

# Development Workflow

Every feature follows the same lifecycle.

```
Requirement

↓

Design

↓

Implementation

↓

Testing

↓

Code Review

↓

Merge

↓

Deployment
```

---

# CI/CD

Every push triggers automated quality checks.

Pipeline stages:

1. Install dependencies
2. Lint
3. Type check
4. Run tests
5. Build application
6. Build Docker image
7. Deploy (production branches only)

---

# Deployment

The service is designed to run on:

* Docker
* VPS
* AWS
* Railway
* Render
* Azure
* Google Cloud

The deployment platform is independent of the application architecture.

---

# Development Roadmap

## Phase 1

Project initialization

Development environment

Docker

Prisma

Database

---

## Phase 2

Currency management

Exchange rate collection

Historical storage

---

## Phase 3

Trend analysis

Alert engine

Scheduled jobs

---

## Phase 4

REST API

Validation

Testing

---

## Phase 5

Production deployment

Monitoring

Performance optimization

---

# Contributing

Before contributing:

* Follow the coding standards.
* Write tests for new functionality.
* Update documentation when necessary.
* Ensure linting and tests pass before submitting changes.

---

# License

This project is licensed under the MIT License.

---

# Relationship to the RemitIQ Ecosystem

The Market Service is one of four independent applications within the RemitIQ ecosystem.

* **remitIQ-market-service** — Exchange rates, trends, alerts.
* **remitIQ-household-service** — Authentication, households, budgets, remittance records.
* **remitIQ-web** — Web dashboard consuming backend APIs.
* **remitIQ-mobile** — Mobile application consuming backend APIs.

Each application is independently developed, versioned, deployed, and documented. Communication occurs exclusively through versioned REST APIs, ensuring loose coupling and allowing each service to evolve without requiring direct access to another service's codebase or database.
