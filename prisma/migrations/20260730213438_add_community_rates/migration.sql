-- CreateTable
CREATE TABLE "community_rates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "base_currency_id" TEXT NOT NULL,
    "quote_currency_id" TEXT NOT NULL,
    "rate" DECIMAL(20,10) NOT NULL,
    "location" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_rates_base_currency_id_quote_currency_id_idx" ON "community_rates"("base_currency_id", "quote_currency_id");

-- CreateIndex
CREATE INDEX "community_rates_user_id_idx" ON "community_rates"("user_id");

-- AddForeignKey
ALTER TABLE "community_rates" ADD CONSTRAINT "community_rates_base_currency_id_fkey" FOREIGN KEY ("base_currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_rates" ADD CONSTRAINT "community_rates_quote_currency_id_fkey" FOREIGN KEY ("quote_currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
