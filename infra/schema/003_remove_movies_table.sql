-- Migrates from legacy schema (movies table + movie_id FKs) to metadata-based schema.
-- Safe to re-run: checks table/column existence before applying each step.

ALTER TABLE ratings ADD COLUMN IF NOT EXISTS movie_title VARCHAR(255);
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS movie_year INTEGER;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS movie_genres VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS movie_overview TEXT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS poster_url VARCHAR(500);

ALTER TABLE watchlist_items ADD COLUMN IF NOT EXISTS movie_title VARCHAR(255);
ALTER TABLE watchlist_items ADD COLUMN IF NOT EXISTS movie_year INTEGER;
ALTER TABLE watchlist_items ADD COLUMN IF NOT EXISTS poster_url VARCHAR(500);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ratings' AND column_name = 'movie_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'movies'
    ) THEN
        UPDATE ratings r
        SET
            movie_title = COALESCE(r.movie_title, m.title),
            movie_year = COALESCE(r.movie_year, m.year),
            movie_genres = COALESCE(r.movie_genres, m.genres, ''),
            movie_overview = COALESCE(r.movie_overview, m.overview)
        FROM movies m
        WHERE r.movie_id = m.id;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'watchlist_items' AND column_name = 'movie_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'movies'
    ) THEN
        UPDATE watchlist_items w
        SET
            movie_title = COALESCE(w.movie_title, m.title),
            movie_year = COALESCE(w.movie_year, m.year)
        FROM movies m
        WHERE w.movie_id = m.id;
    END IF;
END $$;

UPDATE ratings SET movie_title = 'Unknown Title' WHERE movie_title IS NULL;
UPDATE watchlist_items SET movie_title = 'Unknown Title' WHERE movie_title IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ratings' AND column_name = 'movie_id'
    ) THEN
        ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_movie_id_fkey;
        ALTER TABLE ratings DROP COLUMN movie_id;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'watchlist_items' AND column_name = 'movie_id'
    ) THEN
        ALTER TABLE watchlist_items DROP CONSTRAINT IF EXISTS watchlist_items_movie_id_fkey;
        ALTER TABLE watchlist_items DROP COLUMN movie_id;
    END IF;
END $$;

ALTER TABLE ratings DROP CONSTRAINT IF EXISTS uq_user_movie_rating;
ALTER TABLE watchlist_items DROP CONSTRAINT IF EXISTS uq_user_movie_watchlist;

ALTER TABLE ratings ALTER COLUMN movie_title SET NOT NULL;
ALTER TABLE watchlist_items ALTER COLUMN movie_title SET NOT NULL;

ALTER TABLE ratings
    ADD CONSTRAINT uq_user_movie_rating UNIQUE (user_id, movie_title);
ALTER TABLE watchlist_items
    ADD CONSTRAINT uq_user_movie_watchlist UNIQUE (user_id, movie_title);

DROP TABLE IF EXISTS movies;
