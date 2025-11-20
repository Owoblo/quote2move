#!/usr/bin/env node

const https = require('https');

const ACCESS_TOKEN = 'sbp_ed3873fc1121cb8b0caf60e984d030a1f54574c7';

const sql = `
-- Create RPC function to handle company creation
CREATE OR REPLACE FUNCTION create_company_with_admin(
  p_company_name TEXT,
  p_admin_id UUID,
  p_admin_name TEXT,
  p_phone TEXT,
  p_address TEXT,
  p_truck_count INT,
  p_service_area TEXT
)
RETURNS JSON AS $$
DECLARE
  v_company_id UUID;
  v_result JSON;
BEGIN
  -- Insert company
  INSERT INTO movsense.companies (name, owner_id, phone, address, truck_count, service_area)
  VALUES (p_company_name, p_admin_id, p_phone, p_address, p_truck_count, p_service_area)
  RETURNING id INTO v_company_id;

  -- Update profile with company_id and role
  UPDATE movsense.profiles
  SET company_id = v_company_id,
      role = 'admin'::movsense.user_role
  WHERE id = p_admin_id;

  -- Return result
  v_result := json_build_object(
    'success', true,
    'company_id', v_company_id,
    'user_id', p_admin_id
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/idbyrtwdeeruiutoukct/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ RPC function created successfully!');
    } else {
      console.log('❌ Failed to create RPC function');
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(JSON.stringify({ query: sql }));
req.end();
