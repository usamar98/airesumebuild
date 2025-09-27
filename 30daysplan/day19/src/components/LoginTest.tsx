import React, { useEffect } from 'react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';

const LoginTest: React.FC = () => {
  const { login } = useSupabaseAuth();

  useEffect(() => {
    const testLogin = async () => {
      console.log('🧪 LoginTest: Starting automatic login test...');
      
      try {
        const result = await login('testuser@gmail.com', 'TestPassword123!');
        console.log('🧪 LoginTest: Login result:', result);
      } catch (error) {
        console.error('🧪 LoginTest: Login error:', error);
      }
    };

    // Test login after a short delay
    const timer = setTimeout(testLogin, 2000);
    return () => clearTimeout(timer);
  }, [login]);

  return (
    <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded z-50">
      <p className="text-sm">🧪 Login Test Component Active</p>
      <p className="text-xs">Check console for test results</p>
    </div>
  );
};

export default LoginTest;