-- Create jobs table
CREATE TABLE jobs (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    budget VARCHAR(100),
    skills JSONB,
    client_info JSONB,
    source VARCHAR(50) NOT NULL,
    posted_date TIMESTAMP WITH TIME ZONE,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for jobs table
CREATE INDEX idx_jobs_source ON jobs(source);
CREATE INDEX idx_jobs_posted_date ON jobs(posted_date DESC);
CREATE INDEX idx_jobs_skills ON jobs USING GIN(skills);

-- Create saved_jobs table
CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id VARCHAR(255) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'rejected', 'interview')),
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for saved_jobs table
CREATE INDEX idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX idx_saved_jobs_status ON saved_jobs(status);
CREATE UNIQUE INDEX idx_saved_jobs_user_job ON saved_jobs(user_id, job_id);

-- Create proposals table
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id VARCHAR(255) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    proposal_text TEXT NOT NULL,
    tone VARCHAR(50) DEFAULT 'professional',
    length VARCHAR(50) DEFAULT 'medium',
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for proposals table
CREATE INDEX idx_proposals_user_id ON proposals(user_id);
CREATE INDEX idx_proposals_job_id ON proposals(job_id);
CREATE INDEX idx_proposals_generated_at ON proposals(generated_at DESC);

-- Grant basic read access to anon role
GRANT SELECT ON jobs TO anon;

-- Grant full access to authenticated role
GRANT ALL PRIVILEGES ON jobs TO authenticated;
GRANT ALL PRIVILEGES ON saved_jobs TO authenticated;
GRANT ALL PRIVILEGES ON proposals TO authenticated;

-- Insert sample job data for testing
INSERT INTO jobs (id, title, description, budget, skills, client_info, source, posted_date) VALUES
('upwork_sample_1', 'React Developer for E-commerce Platform', 'We need an experienced React developer to build our e-commerce platform with modern features including payment integration, user authentication, and responsive design. The ideal candidate should have 3+ years of experience with React, TypeScript, and modern state management solutions.', '$1000-$3000', '["React", "JavaScript", "Node.js", "TypeScript"]', '{"name": "TechCorp", "rating": 4.9, "reviews": 45, "location": "United States"}', 'upwork', NOW() - INTERVAL '2 hours'),
('freelancer_sample_1', 'Full Stack Developer - MERN Stack', 'Looking for a full stack developer with MERN stack experience to build a social media application. Must have experience with MongoDB, Express.js, React, and Node.js. Knowledge of real-time features using Socket.io is a plus.', '$500-$1500', '["MongoDB", "Express", "React", "Node.js", "Socket.io"]', '{"name": "StartupXYZ", "rating": 4.5, "reviews": 12, "location": "Canada"}', 'freelancer', NOW() - INTERVAL '4 hours'),
('upwork_sample_2', 'Frontend Developer - Vue.js Expert', 'Seeking a Vue.js expert to modernize our legacy application. The project involves migrating from jQuery to Vue 3 with Composition API, implementing modern build tools, and ensuring responsive design across all devices.', '$800-$2000', '["Vue.js", "JavaScript", "CSS", "HTML", "Webpack"]', '{"name": "Digital Agency", "rating": 4.7, "reviews": 33, "location": "United Kingdom"}', 'upwork', NOW() - INTERVAL '6 hours');