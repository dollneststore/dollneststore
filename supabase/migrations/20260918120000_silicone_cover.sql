-- New cover photo for the silicone babies collection: a full-length photo of a dressed baby
-- instead of the close-up of a face, which didn't read well in the square card.
-- Safe to run more than once. To choose a different photo later, use
-- /admin/collections → Silicone babies → Cover photo.

update public.categories
set image_url = 'https://lzrggslfgwzlrckbuirh.supabase.co/storage/v1/object/public/product-images/products/aba014f2-e991-4b7a-b1e0-7aa2cfd76d83.jpg'
where slug = 'silicone';
