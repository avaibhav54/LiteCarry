# Supabase Storage Setup for Product Images

Follow these steps to set up the Supabase storage bucket for product images.

## Step 1: Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: **gnuyckjpdhqlkxrmgsfj**

## Step 2: Create Storage Bucket

1. In the left sidebar, click on **Storage**
2. Click the **New bucket** button
3. Enter the following details:
   - **Bucket name**: `product-images`
   - **Public bucket**: Toggle ON (to allow public access to images)
   - **File size limit**: Leave default or set to 5 MB
4. Click **Create bucket**

## Step 3: Configure Bucket Policies

1. Click on the `product-images` bucket you just created
2. Go to the **Policies** tab
3. Click **New Policy**
4. Select **For full customization** (Custom policy)

### Policy 1: Public Read Access
- **Policy name**: `Public read access`
- **Allowed operation**: SELECT
- **Policy definition**:
  ```sql
  (bucket_id = 'product-images'::text)
  ```
- Click **Review** then **Save policy**

### Policy 2: Authenticated Upload (Optional - for future user uploads)
- **Policy name**: `Authenticated upload`
- **Allowed operation**: INSERT
- **Policy definition**:
  ```sql
  (bucket_id = 'product-images'::text AND auth.role() = 'authenticated')
  ```
- Click **Review** then **Save policy**

### Policy 3: Service Role Full Access
- **Policy name**: `Service role full access`
- **Allowed operation**: ALL
- **Policy definition**:
  ```sql
  (bucket_id = 'product-images'::text AND auth.role() = 'service_role')
  ```
- Click **Review** then **Save policy**

## Step 4: Verify Setup

The storage bucket is now ready! Your API will automatically:
- Upload images to `product-images/products/` folder
- Generate unique filenames with timestamps
- Return public URLs for uploaded images

## File Structure

Images will be organized as:
```
product-images/
└── products/
    ├── 1732789123456-abc123.jpg
    ├── 1732789234567-def456.png
    └── ...
```

## Using the Upload Feature

In the admin panel (http://localhost:3000/admin):
1. Click "Add New Product" or "Edit" an existing product
2. Fill in the product details
3. Click **Upload Images** button
4. Select one or multiple images (JPG, PNG, WebP)
5. Images will automatically upload to Supabase Storage
6. First image is marked as primary
7. Click **Add Product** or **Update Product** to save

## Public URL Format

Uploaded images will have public URLs like:
```
https://gnuyckjpdhqlkxrmgsfj.supabase.co/storage/v1/object/public/product-images/products/1732789123456-abc123.jpg
```

These URLs can be directly used in your frontend to display product images.

## Troubleshooting

### Issue: "Failed to upload image"
- **Solution**: Check that the bucket name is exactly `product-images`
- **Solution**: Verify the bucket is set to **Public**
- **Solution**: Check that policies are correctly configured

### Issue: "Access denied"
- **Solution**: Ensure your `SUPABASE_SERVICE_ROLE_KEY` in `.env` is correct
- **Solution**: Verify the service role policy is enabled

### Issue: Images not displaying
- **Solution**: Check if the bucket is set to **Public**
- **Solution**: Verify the public URL format is correct
- **Solution**: Check browser console for CORS errors

## Security Notes

- Service role key is used for server-side uploads (secure)
- Bucket is public for read access only
- Consider adding file size limits in production
- Implement image optimization before upload in production
