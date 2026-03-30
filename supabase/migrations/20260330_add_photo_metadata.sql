-- Photo metadata for automatic EXIF pinning + manual override
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS location_source text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS manual_override boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_place_name text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'photos_location_source_check'
  ) THEN
    ALTER TABLE photos
      ADD CONSTRAINT photos_location_source_check
      CHECK (location_source IN ('exif', 'manual', 'none'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS photos_atlas_id_idx ON photos (atlas_id);
CREATE INDEX IF NOT EXISTS photos_captured_at_idx ON photos (captured_at);
CREATE INDEX IF NOT EXISTS photos_lat_lng_idx ON photos (lat, lng);
