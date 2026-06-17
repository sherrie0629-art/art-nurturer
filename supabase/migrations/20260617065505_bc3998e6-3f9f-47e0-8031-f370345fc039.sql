-- Idempotent rename of legacy agent_ids to new pinyin IDs.
-- Safe to run even when source rows do not exist.
DO $$
DECLARE
  m record;
BEGIN
  FOR m IN SELECT * FROM (VALUES
    ('mystic','yunsheng'),
    ('bestie','xinggui'),
    ('barista','nuannuan'),
    ('jax','laowang')
  ) AS t(old_id, new_id)
  LOOP
    -- agent_bonds: avoid unique (user_id, agent_id) conflict
    DELETE FROM public.agent_bonds a
      WHERE a.agent_id = m.old_id
        AND EXISTS (SELECT 1 FROM public.agent_bonds b
                    WHERE b.user_id = a.user_id AND b.agent_id = m.new_id);
    UPDATE public.agent_bonds SET agent_id = m.new_id WHERE agent_id = m.old_id;

    UPDATE public.conversations          SET agent_id = m.new_id WHERE agent_id = m.old_id;
    UPDATE public.conversation_summaries SET agent_id = m.new_id WHERE agent_id = m.old_id;
    UPDATE public.user_memories          SET agent_id = m.new_id WHERE agent_id = m.old_id;
    UPDATE public.story_vault            SET agent_id = m.new_id WHERE agent_id = m.old_id;
    UPDATE public.achievements           SET agent_id = m.new_id WHERE agent_id = m.old_id;
    UPDATE public.achievement_defs       SET agent_id = m.new_id WHERE agent_id = m.old_id;
    UPDATE public.achievement_defs       SET condition_agent_id = m.new_id WHERE condition_agent_id = m.old_id;
  END LOOP;
END $$;