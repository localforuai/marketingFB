-- Create posts and Facebook pages tables
-- 
-- 1. New Tables
--    - posts: stores content ideas with approval status
--    - post_media: stores media files (images/videos) for posts
--    - facebook_pages: stores connected Facebook page credentials
-- 
-- 2. Security
--    - Enable RLS on all tables
--    - Add policies for public access (will be restricted when auth is added)

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  media_type text NOT NULL,
  copy_write text NOT NULL,
  full_post text,
  approved_caption text,
  artwork_recommendation text,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  media_source text NOT NULL CHECK (media_source IN ('ai', 'upload')),
  media_url text,
  media_data bytea,
  is_selected boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS facebook_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  page_id text UNIQUE NOT NULL,
  page_name text NOT NULL,
  access_token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to posts"
  ON posts FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public access to post_media"
  ON post_media FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public access to facebook_pages"
  ON facebook_pages FOR ALL
  USING (true)
  WITH CHECK (true);