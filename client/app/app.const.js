import peachRc from '../../.peachrc';
import moment from 'moment-timezone';

export const APP_ID = 228;
export const APP_API_KEY = peachRc.key;
export const ACCT_PREF_KEY_FOR_OVERDUE_TASKS_TASK_SCHEDULE = 'is_overdue_task_schedule_setup';
export const DB_DATE_FORMAT = 'YYYY-MM-DD';
export const DB_FIELDS = ['id', 'created_at', 'created_by', 'updated_at', 'updated_by', 'is_deleted', 'uri'];
export const DEFAULT_LOCATION_ID = 1;
export const DEFAULT_INFO_TIMEOUT = 3000;
export const DEFAULT_NG_MODEL_OPTIONS = {
  updateOn: 'default blur',
  debounce: {
    default: 500,
    blur: 0
  }
};
export const MESSAGE_TYPE_ERROR = 'alert';
export const MESSAGE_TYPE_INFO = 'info';
export const OVERDUE_TASKS_TASK_ID = 129;
export const OVERDUE_TASKS_TASK_SCHEDULE = {
  task_id: OVERDUE_TASKS_TASK_ID,
  start_date: moment().format('YYYY-MM-DD'),
  timezone: 'UTC',
  recur_type: 'hour',
  recur_interval: 1
};
