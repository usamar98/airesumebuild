import { Router, Request, Response } from 'express';
import { supabase } from '../database/supabase';
import { authenticateSupabaseToken, SupabaseAuthenticatedRequest } from '../middleware/supabaseAuth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

interface UserProfile {
  id?: string;
  user_id: string;
  full_name?: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  skills?: string[];
  experience_years?: number;
  education?: any[];
  work_experience?: any[];
  certifications?: any[];
  languages?: string[];
  availability?: 'available' | 'not_available' | 'open_to_opportunities';
  salary_expectation_min?: number;
  salary_expectation_max?: number;
  preferred_job_types?: string[];
  preferred_locations?: string[];
  remote_work_preference?: 'remote_only' | 'hybrid' | 'onsite' | 'flexible';
  company_name?: string;
  company_description?: string;
  company_website?: string;
  company_logo?: string;
  company_size?: string;
  industry?: string;
}

// GET /api/user-profiles/me - Get current user's profile
router.get('/me', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist, create a default one
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: req.user.id,
            full_name: req.user.name || req.user.email?.split('@')[0] || 'User'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user profile:', createError);
          return res.status(500).json({ error: 'Failed to create user profile' });
        }

        return res.json(newProfile);
      }
      console.error('Error fetching user profile:', error);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error in GET /user-profiles/me:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/user-profiles/me - Update current user's profile
router.put('/me', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const profileData = req.body;

    // Remove user_id from update data to prevent modification
    delete profileData.user_id;
    delete profileData.id;

    const { data: updatedProfile, error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return res.status(500).json({ error: 'Failed to update user profile' });
    }

    res.json(updatedProfile);
  } catch (error) {
    console.error('Error in PUT /user-profiles/me:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/user-profiles/avatar - Upload user avatar
router.post('/avatar', authenticateSupabaseToken, upload.single('avatar'), async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const avatarFile = req.file;

    if (!avatarFile) {
      return res.status(400).json({ error: 'Avatar file is required' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(avatarFile.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' });
    }

    // Validate file size (max 5MB)
    if (avatarFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size too large. Maximum 5MB allowed' });
    }

    const fileName = `avatars/${req.user.id}/${Date.now()}-${avatarFile.originalname}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(fileName, avatarFile.buffer, {
        contentType: avatarFile.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return res.status(500).json({ error: 'Failed to upload avatar' });
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(fileName);

    const avatarUrl = urlData.publicUrl;

    // Update user profile with new avatar URL
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: avatarUrl })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile with avatar URL:', updateError);
      return res.status(500).json({ error: 'Failed to update profile with avatar' });
    }

    res.json({ avatar_url: avatarUrl, profile: updatedProfile });
  } catch (error) {
    console.error('Error in POST /user-profiles/avatar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/user-profiles/company-logo - Upload company logo (for employers)
router.post('/company-logo', authenticateSupabaseToken, upload.single('logo'), async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const logoFile = req.file;

    if (!logoFile) {
      return res.status(400).json({ error: 'Logo file is required' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(logoFile.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and SVG are allowed' });
    }

    // Validate file size (max 2MB)
    if (logoFile.size > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size too large. Maximum 2MB allowed' });
    }

    const fileName = `company-logos/${req.user.id}/${Date.now()}-${logoFile.originalname}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(fileName, logoFile.buffer, {
        contentType: logoFile.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading company logo:', uploadError);
      return res.status(500).json({ error: 'Failed to upload company logo' });
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(fileName);

    const logoUrl = urlData.publicUrl;

    // Update user profile with new company logo URL
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({ company_logo: logoUrl })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile with company logo URL:', updateError);
      return res.status(500).json({ error: 'Failed to update profile with company logo' });
    }

    res.json({ company_logo: logoUrl, profile: updatedProfile });
  } catch (error) {
    console.error('Error in POST /user-profiles/company-logo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/user-profiles/:id - Get public profile by user ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        bio,
        location,
        website,
        linkedin_url,
        github_url,
        portfolio_url,
        skills,
        experience_years,
        education,
        work_experience,
        certifications,
        languages,
        availability,
        preferred_job_types,
        preferred_locations,
        remote_work_preference,
        company_name,
        company_description,
        company_website,
        company_logo,
        company_size,
        industry,
        avatar_url,
        created_at
      `)
      .eq('user_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Profile not found' });
      }
      console.error('Error fetching public profile:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error in GET /user-profiles/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/user-profiles/search/candidates - Search for job candidates (for employers)
router.get('/search/candidates', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      skills,
      location,
      experience_min,
      experience_max,
      availability,
      remote_work_preference,
      job_type,
      search
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('user_profiles')
      .select(`
        id,
        user_id,
        full_name,
        bio,
        location,
        skills,
        experience_years,
        availability,
        preferred_job_types,
        preferred_locations,
        remote_work_preference,
        avatar_url,
        linkedin_url,
        portfolio_url
      `, { count: 'exact' })
      .eq('availability', 'available');

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,bio.ilike.%${search}%`);
    }

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      query = query.overlaps('skills', skillsArray);
    }

    if (location) {
      query = query.or(`location.ilike.%${location}%,preferred_locations.cs.{"${location}"}`);
    }

    if (experience_min) {
      query = query.gte('experience_years', Number(experience_min));
    }

    if (experience_max) {
      query = query.lte('experience_years', Number(experience_max));
    }

    if (availability) {
      query = query.eq('availability', availability);
    }

    if (remote_work_preference) {
      query = query.eq('remote_work_preference', remote_work_preference);
    }

    if (job_type) {
      query = query.contains('preferred_job_types', [job_type]);
    }

    // Apply pagination
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: candidates, error, count } = await query;

    if (error) {
      console.error('Error searching candidates:', error);
      return res.status(500).json({ error: 'Failed to search candidates' });
    }

    res.json({
      candidates: candidates || [],
      total: count || 0,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Error in GET /user-profiles/search/candidates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/user-profiles/availability - Update availability status
router.put('/availability', authenticateSupabaseToken, async (req: SupabaseAuthenticatedRequest, res: Response) => {
  try {
    const { availability } = req.body;

    const validStatuses = ['available', 'not_available', 'open_to_opportunities'];
    if (!validStatuses.includes(availability)) {
      return res.status(400).json({ error: 'Invalid availability status' });
    }

    const { data: updatedProfile, error } = await supabase
      .from('user_profiles')
      .update({ availability })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating availability:', error);
      return res.status(500).json({ error: 'Failed to update availability' });
    }

    res.json(updatedProfile);
  } catch (error) {
    console.error('Error in PUT /user-profiles/availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;