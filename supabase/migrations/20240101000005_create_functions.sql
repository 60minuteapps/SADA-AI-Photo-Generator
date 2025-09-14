-- Function to create or get anonymous session
CREATE OR REPLACE FUNCTION create_anonymous_session(device_id_param TEXT DEFAULT NULL)
RETURNS TABLE(session_id UUID, session_token TEXT) AS $$
DECLARE
  new_session_id UUID;
  new_session_token TEXT;
BEGIN
  -- Generate a unique session token
  new_session_token := encode(gen_random_bytes(32), 'base64');
  
  -- Insert new session
  INSERT INTO user_sessions (session_token, device_id)
  VALUES (new_session_token, device_id_param)
  RETURNING id INTO new_session_id;
  
  RETURN QUERY SELECT new_session_id, new_session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(session_token_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_sessions 
  SET last_active_at = NOW()
  WHERE session_token = session_token_param 
    AND expires_at > NOW();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to anonymous users
GRANT EXECUTE ON FUNCTION create_anonymous_session TO anon;
GRANT EXECUTE ON FUNCTION update_session_activity TO anon;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions TO anon;
