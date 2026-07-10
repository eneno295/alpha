-- 场次结清字段（在 Supabase SQL Editor 执行，不删数据）
alter table history_data add column if not exists settled boolean not null default false;
alter table history_data add column if not exists settled_at text;

comment on column history_data.settled is '场次是否已结清';
comment on column history_data.settled_at is '结清时间 YYYY-MM-DD HH:mm:ss';

-- 若已建过操作日志表，放开 settle_session 操作类型
alter table history_operation_logs drop constraint if exists history_operation_logs_operation_check;
alter table history_operation_logs add constraint history_operation_logs_operation_check check (
  operation in (
    'add_person',
    'remove_person',
    'add_session',
    'delete_session',
    'add_round',
    'update_round',
    'remove_round',
    'settle_session'
  )
);
