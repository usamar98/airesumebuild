-- Grant permissions for jobs table
GRANT SELECT ON jobs TO anon;
GRANT ALL PRIVILEGES ON jobs TO authenticated;

-- Grant permissions for saved_jobs table
GRANT SELECT ON saved_jobs TO anon;
GRANT ALL PRIVILEGES ON saved_jobs TO authenticated;

-- Grant permissions for proposals table
GRANT SELECT ON proposals TO anon;
GRANT ALL PRIVILEGES ON proposals TO authenticated;

-- Insert some sample jobs for testing
INSERT INTO jobs (id, title, description, budget, skills, client_info, source, posted_date) VALUES
('job_001', 'Full Stack Developer Needed', 'We are looking for an experienced full stack developer to build a modern web application using React and Node.js. The ideal candidate should have experience with TypeScript, PostgreSQL, and cloud deployment.', '$3000 - $5000', '["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"]', '{"rating": 4.8, "reviews": 127, "location": "United States", "verified": true}', 'upwork', NOW() - INTERVAL '2 days'),
('job_002', 'React Frontend Developer', 'Looking for a skilled React developer to create responsive user interfaces. Must have experience with modern React hooks, state management, and CSS frameworks like Tailwind CSS.', '$2000 - $3500', '["React", "JavaScript", "Tailwind CSS", "Redux", "HTML/CSS"]', '{"rating": 4.5, "reviews": 89, "location": "Canada", "verified": true}', 'upwork', NOW() - INTERVAL '1 day'),
('job_003', 'Backend API Developer', 'Need an experienced backend developer to create RESTful APIs using Node.js and Express. Knowledge of database design and authentication systems required.', '$2500 - $4000', '["Node.js", "Express", "MongoDB", "REST API", "Authentication"]', '{"rating": 4.9, "reviews": 203, "location": "United Kingdom", "verified": true}', 'upwork', NOW() - INTERVAL '3 hours'),
('job_004', 'Mobile App Developer', 'Seeking a React Native developer to build cross-platform mobile applications. Experience with native modules and app store deployment preferred.', '$3500 - $6000', '["React Native", "JavaScript", "iOS", "Android", "Firebase"]', '{"rating": 4.7, "reviews": 156, "location": "Australia", "verified": false}', 'freelancer', NOW() - INTERVAL '5 hours'),
('job_005', 'DevOps Engineer', 'Looking for a DevOps engineer to set up CI/CD pipelines and manage cloud infrastructure. Experience with Docker, Kubernetes, and AWS required.', '$4000 - $7000', '["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform"]', '{"rating": 4.6, "reviews": 94, "location": "Germany", "verified": true}', 'upwork', NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;