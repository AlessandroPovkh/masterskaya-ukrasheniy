CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY,
  item_ids text[] NOT NULL,
  amount_minor integer NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL CHECK (currency = 'RUB'),
  idempotence_key text NOT NULL UNIQUE,
  status text NOT NULL,
  payment jsonb,
  created_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS inventory_reservations (
  product_id text PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  provider_payment_id text NOT NULL UNIQUE,
  idempotence_key text NOT NULL UNIQUE,
  amount_minor integer NOT NULL,
  currency text NOT NULL CHECK (currency = 'RUB'),
  status text NOT NULL,
  test boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS webhook_receipts (
  body_hash text PRIMARY KEY,
  event_type text NOT NULL,
  provider_object_id text NOT NULL,
  result text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);
