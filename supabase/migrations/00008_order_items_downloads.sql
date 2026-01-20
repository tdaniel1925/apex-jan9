/**
 * Add Download Tracking to Order Items
 * Track remaining downloads for each order item
 */

-- Add downloads_remaining column to order_items (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'downloads_remaining'
  ) THEN
    ALTER TABLE order_items ADD COLUMN downloads_remaining INTEGER NOT NULL DEFAULT 5;
  END IF;
END $$;

-- Create function to set initial downloads_remaining from product
CREATE OR REPLACE FUNCTION set_order_item_downloads()
RETURNS TRIGGER AS $$
DECLARE
  product_download_limit INTEGER;
BEGIN
  -- Get the product's download_limit
  SELECT download_limit INTO product_download_limit
  FROM products
  WHERE id = NEW.product_id;

  -- Set downloads_remaining to product's limit
  NEW.downloads_remaining := COALESCE(product_download_limit, 5);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set downloads_remaining on insert (drop first if exists)
DROP TRIGGER IF EXISTS set_order_item_downloads_trigger ON order_items;
CREATE TRIGGER set_order_item_downloads_trigger
  BEFORE INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION set_order_item_downloads();

-- Comment
COMMENT ON COLUMN order_items.downloads_remaining IS 'Remaining downloads for this order item (-1 = unlimited)';
