-- 013_account_delete_rpc.sql — Atomic account deletion via RPC
-- All user-scoped tables (progress, submissions, conversations [→ messages],
-- token_usage [SET NULL], onboarding, user_stats, notes, bug_reports,
-- playground_state, playground_runs) reference auth.users(id) with ON DELETE
-- CASCADE (token_usage uses SET NULL by design — historical cost data is kept).
-- Therefore a single DELETE on auth.users cascades through everything,
-- replacing the previous multi-step deletion in app/api/account/route.ts that
-- could leave a user half-deleted on partial failure.
--
-- SECURITY DEFINER is required to touch auth.users from an authenticated
-- session.  The function explicitly re-checks auth.uid() and only deletes
-- that exact row, so the caller can never delete anyone else's account.

CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION delete_my_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_my_account() TO authenticated;
