INSERT INTO movies (title, year, genres, overview)
VALUES
    ('Inception', 2010, 'Sci-Fi,Thriller', 'A thief enters dreams to plant an idea.'),
    ('The Dark Knight', 2008, 'Action,Crime', 'Batman faces the Joker in Gotham.'),
    ('Interstellar', 2014, 'Sci-Fi,Drama', 'Astronauts travel through a wormhole to save humanity.'),
    ('The Matrix', 1999, 'Sci-Fi,Action', 'A hacker discovers the nature of reality.'),
    ('Whiplash', 2014, 'Drama,Music', 'A drummer struggles under a demanding mentor.')
ON CONFLICT DO NOTHING;
