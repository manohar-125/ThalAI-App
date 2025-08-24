
-- Users Table

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    age INT CHECK (age > 0),
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Health Records Table

CREATE TABLE health_records (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    condition TEXT,   -- e.g., "Anemia", "Thalassemia Minor"
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CBC Tests Table

CREATE TABLE cbc_tests (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    hemoglobin DECIMAL(5,2) CHECK (hemoglobin >= 0),
    rbc_count DECIMAL(5,2) CHECK (rbc_count >= 0),
    wbc_count DECIMAL(7,2) CHECK (wbc_count >= 0),
    platelet_count DECIMAL(7,2) CHECK (platelet_count >= 0),
    mcv DECIMAL(5,2) CHECK (mcv >= 0),  -- Mean Corpuscular Volume
    mch DECIMAL(5,2) CHECK (mch >= 0),  -- Mean Corpuscular Hemoglobin
    mchc DECIMAL(5,2) CHECK (mchc >= 0), -- Mean Corpuscular Hemoglobin Concentration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictions Table

CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id INT REFERENCES cbc_tests(id) ON DELETE CASCADE,
    prediction_result VARCHAR(100) NOT NULL, -- e.g., "Normal", "Thalassemia Suspected"
    confidence_score DECIMAL(5,2),  -- e.g., 87.5 (%)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_cbc_user ON cbc_tests(user_id);
CREATE INDEX idx_pred_user ON predictions(user_id);
