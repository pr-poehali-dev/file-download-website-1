CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    original_name VARCHAR(500) NOT NULL,
    size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by VARCHAR(200) NOT NULL,
    downloads_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE download_history (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files(id),
    user_id VARCHAR(200) NOT NULL,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_files_category ON files(category);
CREATE INDEX idx_files_created_at ON files(created_at DESC);
CREATE INDEX idx_download_history_user ON download_history(user_id);
CREATE INDEX idx_download_history_file ON download_history(file_id);