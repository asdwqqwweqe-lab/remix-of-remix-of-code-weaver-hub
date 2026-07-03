
-- Rooms
CREATE TABLE public.collab_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  member_emails TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collab_rooms TO authenticated;
GRANT ALL ON public.collab_rooms TO service_role;

ALTER TABLE public.collab_rooms ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_room_member(_room_id UUID, _user_id UUID, _email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.collab_rooms r
    WHERE r.id = _room_id
      AND (r.owner_id = _user_id OR lower(_email) = ANY (SELECT lower(e) FROM unnest(r.member_emails) AS e))
  );
$$;

CREATE POLICY "Members can view rooms"
  ON public.collab_rooms FOR SELECT
  TO authenticated
  USING (
    auth.uid() = owner_id
    OR lower((auth.jwt() ->> 'email')) = ANY (SELECT lower(e) FROM unnest(member_emails) AS e)
  );

CREATE POLICY "Users can create their own rooms"
  ON public.collab_rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can update rooms"
  ON public.collab_rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can delete rooms"
  ON public.collab_rooms FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE INDEX collab_rooms_owner_idx ON public.collab_rooms(owner_id);

CREATE TRIGGER collab_rooms_set_updated_at
  BEFORE UPDATE ON public.collab_rooms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Notes
CREATE TABLE public.collab_room_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.collab_rooms(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_name TEXT,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collab_room_notes TO authenticated;
GRANT ALL ON public.collab_room_notes TO service_role;

ALTER TABLE public.collab_room_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view room notes"
  ON public.collab_room_notes FOR SELECT
  TO authenticated
  USING (public.is_room_member(room_id, auth.uid(), (auth.jwt() ->> 'email')));

CREATE POLICY "Members can add notes"
  ON public.collab_room_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND public.is_room_member(room_id, auth.uid(), (auth.jwt() ->> 'email'))
  );

CREATE POLICY "Author or owner can update notes"
  ON public.collab_room_notes FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.collab_rooms r WHERE r.id = room_id AND r.owner_id = auth.uid())
  )
  WITH CHECK (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.collab_rooms r WHERE r.id = room_id AND r.owner_id = auth.uid())
  );

CREATE POLICY "Author or owner can delete notes"
  ON public.collab_room_notes FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.collab_rooms r WHERE r.id = room_id AND r.owner_id = auth.uid())
  );

CREATE INDEX collab_room_notes_room_idx ON public.collab_room_notes(room_id, created_at DESC);

CREATE TRIGGER collab_room_notes_set_updated_at
  BEFORE UPDATE ON public.collab_room_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
