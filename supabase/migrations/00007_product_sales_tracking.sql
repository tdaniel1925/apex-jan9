/**
 * Product Sales Tracking Function
 * Increment product sales count and revenue atomically
 */

-- Function to increment product sales and revenue
CREATE OR REPLACE FUNCTION increment_product_sales(
  p_product_id UUID,
  p_quantity INTEGER,
  p_revenue DECIMAL(10,2)
)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET
    total_sales = total_sales + p_quantity,
    total_revenue = total_revenue + p_revenue,
    updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (service role will use it via webhook)
GRANT EXECUTE ON FUNCTION increment_product_sales(UUID, INTEGER, DECIMAL) TO authenticated, service_role;
