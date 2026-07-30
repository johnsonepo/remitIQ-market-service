-- CreateEnum
CREATE TYPE "AlertCondition" AS ENUM ('GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL');

-- CreateEnum
CREATE TYPE "AlertEventStatus" AS ENUM ('PENDING', 'NOTIFIED', 'FAILED');

-- CreateTable
CREATE TABLE "currencies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "base_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "base_currency_id" TEXT NOT NULL,
    "quote_currency_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "rate" DECIMAL(20,10) NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rate_history" (
    "id" TEXT NOT NULL,
    "base_currency_id" TEXT NOT NULL,
    "quote_currency_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "rate" DECIMAL(20,10) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rate_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "base_currency_id" TEXT NOT NULL,
    "quote_currency_id" TEXT NOT NULL,
    "condition" "AlertCondition" NOT NULL,
    "threshold" DECIMAL(20,10) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_events" (
    "id" TEXT NOT NULL,
    "alert_rule_id" TEXT NOT NULL,
    "triggered_rate" DECIMAL(20,10) NOT NULL,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified_at" TIMESTAMP(3),
    "status" "AlertEventStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "providers_name_key" ON "providers"("name");

-- CreateIndex
CREATE INDEX "exchange_rates_base_currency_id_quote_currency_id_idx" ON "exchange_rates"("base_currency_id", "quote_currency_id");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_base_currency_id_quote_currency_id_provider__key" ON "exchange_rates"("base_currency_id", "quote_currency_id", "provider_id");

-- CreateIndex
CREATE INDEX "exchange_rate_history_base_currency_id_quote_currency_id_re_idx" ON "exchange_rate_history"("base_currency_id", "quote_currency_id", "recorded_at");

-- CreateIndex
CREATE INDEX "alert_rules_user_id_idx" ON "alert_rules"("user_id");

-- CreateIndex
CREATE INDEX "alert_rules_base_currency_id_quote_currency_id_idx" ON "alert_rules"("base_currency_id", "quote_currency_id");

-- CreateIndex
CREATE INDEX "alert_events_alert_rule_id_idx" ON "alert_events"("alert_rule_id");

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_base_currency_id_fkey" FOREIGN KEY ("base_currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_quote_currency_id_fkey" FOREIGN KEY ("quote_currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_alert_rule_id_fkey" FOREIGN KEY ("alert_rule_id") REFERENCES "alert_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
