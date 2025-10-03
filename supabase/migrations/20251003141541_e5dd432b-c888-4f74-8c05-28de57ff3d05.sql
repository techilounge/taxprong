-- Update expenses table to support multiple receipt URLs
ALTER TABLE expenses 
ALTER COLUMN receipt_url TYPE text[] 
USING CASE 
  WHEN receipt_url IS NULL THEN NULL 
  ELSE ARRAY[receipt_url]::text[] 
END;