
REVOKE EXECUTE ON FUNCTION public.is_room_member(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_room_member(UUID, UUID, TEXT) TO service_role;
