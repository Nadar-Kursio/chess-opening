-- Move sounds become a choice of set rather than on/off ("off" keeps everyone who had them off),
-- and Learn gains a narrating coach: whether it speaks, in which voice, and how fast (percent).
alter table user_settings alter column sound drop default;
alter table user_settings
  alter column sound type text using case when sound then 'wood' else 'off' end;
alter table user_settings alter column sound set default 'wood';
alter table user_settings
  add constraint user_settings_sound_check check (sound in ('off', 'wood', 'soft', 'crisp')),
  add column narration boolean not null default true,
  add column voice text not null default 'brian' check (voice in ('brian', 'amy', 'matthew')),
  add column speech_rate smallint not null default 100 check (speech_rate in (90, 100, 125, 150));
