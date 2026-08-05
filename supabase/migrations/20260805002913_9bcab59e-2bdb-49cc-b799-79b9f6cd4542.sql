-- 1. RLS Enabled No Policy: Create policy for user_roles
-- (Even if it's internal, a policy is required when RLS is enabled)
CREATE POLICY "authenticated_can_read_own_role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2 & 3: Revoke public/authenticated execute on SECURITY DEFINER function
-- This function is used by RLS policies (which run with owner privileges), 
-- it doesn't need to be callable directly by users.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;

-- Ensure service_role can still execute it if needed (optional but good practice)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
