-- Insert sample job postings for testing
INSERT INTO job_postings (
  title,
  description,
  requirements,
  salary_min,
  salary_max,
  location,
  job_type,
  experience_level,
  skills,
  remote_allowed,
  status,
  posted_by
) VALUES 
(
  'Senior Frontend Developer',
  'We are looking for an experienced Frontend Developer to join our dynamic team. You will be responsible for developing user-facing web applications using modern JavaScript frameworks.',
  '["3+ years of React experience", "Strong knowledge of TypeScript", "Experience with modern CSS frameworks", "Understanding of responsive design principles"]',
  80000,
  120000,
  'San Francisco, CA',
  'full_time',
  'senior',
  '["React", "TypeScript", "CSS", "JavaScript", "HTML"]',
  true,
  'active',
  (SELECT id FROM users LIMIT 1)
),
(
  'Full Stack Developer',
  'Join our startup as a Full Stack Developer and help build the next generation of web applications. You will work with both frontend and backend technologies.',
  '["2+ years of full stack development", "Experience with Node.js and React", "Database design knowledge", "API development experience"]',
  60000,
  90000,
  'New York, NY',
  'full_time',
  'mid',
  '["React", "Node.js", "PostgreSQL", "Express", "JavaScript"]',
  false,
  'active',
  (SELECT id FROM users LIMIT 1)
),
(
  'UI/UX Designer',
  'We are seeking a creative UI/UX Designer to create amazing user experiences. You will be responsible for the entire design process from concept to implementation.',
  '["Portfolio demonstrating UI/UX skills", "Proficiency in design tools (Figma, Sketch)", "Understanding of user-centered design", "Experience with prototyping"]',
  50000,
  75000,
  'Remote',
  'contract',
  'mid',
  '["Figma", "Sketch", "Adobe Creative Suite", "Prototyping", "User Research"]',
  true,
  'active',
  (SELECT id FROM users LIMIT 1)
),
(
  'Backend Developer',
  'Looking for a Backend Developer to build scalable server-side applications. You will work with databases, APIs, and cloud services.',
  '["Strong knowledge of server-side programming", "Database design and optimization", "API development", "Cloud services experience"]',
  70000,
  100000,
  'Austin, TX',
  'full_time',
  'senior',
  '["Python", "Django", "PostgreSQL", "AWS", "Docker"]',
  true,
  'active',
  (SELECT id FROM users LIMIT 1)
),
(
  'Junior Web Developer',
  'Great opportunity for a Junior Web Developer to start their career. You will work on various web projects and learn from experienced developers.',
  '["Basic knowledge of HTML, CSS, JavaScript", "Eagerness to learn", "Good problem-solving skills", "Team player attitude"]',
  40000,
  55000,
  'Chicago, IL',
  'full_time',
  'entry',
  '["HTML", "CSS", "JavaScript", "Git", "Responsive Design"]',
  false,
  'active',
  (SELECT id FROM users LIMIT 1)
);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON job_postings TO anon;
GRANT ALL PRIVILEGES ON job_postings TO authenticated;