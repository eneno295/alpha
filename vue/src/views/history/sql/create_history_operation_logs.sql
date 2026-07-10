-- 输赢记录 · 操作日志表
-- 在 Supabase SQL Editor 执行（不影响 history_data 现有数据）
--
-- operation   动词：做了什么（add_person / update_round …）
-- target_type 名词：动的是哪类对象（people / session / round）
-- target_id   对象 id（人员 id、场次 id、局 id；删除人员等可为空）
-- ip          操作人公网 IP（前端获取后写入）
-- before_data 变更前快照（jsonb，新建可为 null）
-- after_data  变更后快照（jsonb，删除可为 null）
-- created_at  操作时间，文本 YYYY-MM-DD HH:mm:ss

create table if not exists history_operation_logs (
  id            bigint generated always as identity primary key,
  operation     text not null,
  target_type   text not null,
  target_id     text,
  ip            text,
  before_data   jsonb,
  after_data    jsonb,
  created_at    text not null,

  constraint history_operation_logs_operation_check check (
    operation in (
      'add_person',
      'remove_person',
      'add_session',
      'delete_session',
      'add_round',
      'update_round',
      'remove_round'
    )
  ),
  constraint history_operation_logs_target_type_check check (
    target_type in ('people', 'session', 'round')
  )
);

comment on table history_operation_logs is '输赢记录操作审计日志（只追加）';
comment on column history_operation_logs.operation is '操作类型：动词，如 update_round';
comment on column history_operation_logs.target_type is '被操作对象类型：名词，如 round';
comment on column history_operation_logs.target_id is '被操作对象 id';
comment on column history_operation_logs.ip is '操作人 IP';
comment on column history_operation_logs.before_data is '变更前数据快照';
comment on column history_operation_logs.after_data is '变更后数据快照';
comment on column history_operation_logs.created_at is '操作时间 YYYY-MM-DD HH:mm:ss';

-- 列表：按时间新→旧
create index if not exists history_operation_logs_created_at_idx
  on history_operation_logs (created_at desc);

-- 按操作类型筛选
create index if not exists history_operation_logs_operation_idx
  on history_operation_logs (operation);

-- 按对象查历史（如某场的所有改动）
create index if not exists history_operation_logs_target_idx
  on history_operation_logs (target_type, target_id);

alter table history_operation_logs enable row level security;

drop policy if exists "history_operation_logs_all" on history_operation_logs;
create policy "history_operation_logs_all" on history_operation_logs
  for all using (true) with check (true);
