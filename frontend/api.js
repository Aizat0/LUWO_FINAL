const BASE = {
  auth: '/api/auth', education: '/api/education', assignments: '/api/assignments',
};
const KEY = 'luwo_tokens';

const getTokens = () => {
  try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch { return {}; }
};
const saveTokens = value => sessionStorage.setItem(KEY, JSON.stringify(value));

async function call(base, path, options = {}, retry = true) {
  const token = getTokens().access_token;
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 401 && retry && getTokens().refresh_token) {
    try { await refresh(); return call(base, path, options, false); }
    catch { clearSession(); window.dispatchEvent(new Event('luwo:unauthorized')); }
  }
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    const fieldErrors = data && typeof data === 'object'
      ? Object.entries(data).filter(([key]) => key !== 'detail' && key !== 'message').flatMap(([,value]) => Array.isArray(value) ? value : [value]).join('. ')
      : '';
    const detail = Array.isArray(data.detail)
      ? data.detail.map(item => item.msg).join('. ')
      : data.detail || data.message || fieldErrors || `Ошибка запроса (${response.status})`;
    const error = new Error(detail); error.status = response.status; throw error;
  }
  return data;
}

async function refresh() {
  const current = getTokens();
  const data = await call(BASE.auth, `/auth/refresh/?refresh_token=${encodeURIComponent(current.refresh_token)}`, { method: 'POST' }, false);
  saveTokens({ ...current, ...data });
}

export function clearSession() { sessionStorage.removeItem(KEY); }
export const api = {
  isAuthenticated: () => Boolean(getTokens().access_token),
  async login(username, password) {
    const data = await call(BASE.auth, '/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) }, false);
    saveTokens(data); return data;
  },
  register: payload => call(BASE.auth, '/auth/register/', { method: 'POST', body: JSON.stringify(payload) }, false),
  me: () => call(BASE.auth, '/auth/me/'),
  changePassword: new_password => call(BASE.auth, '/auth/change-password/', {method:'POST',body:JSON.stringify({new_password})}),
  users: () => call(BASE.auth, '/user/'),
  createUser: payload => call(BASE.auth, '/user/', { method: 'POST', body: JSON.stringify(payload) }),
  directory: role => call(BASE.auth, `/user/directory/?role=${encodeURIComponent(role)}`),
  userDetail: id => call(BASE.auth, `/user/${id}/`),
  deleteUser: id => call(BASE.auth, `/user/${id}/`, { method: 'DELETE' }),
  setUserStatus: (id,is_active) => call(BASE.auth, `/user/${id}/status/`, {method:'PATCH',body:JSON.stringify({is_active})}),
  resetUserPassword: id => call(BASE.auth, `/user/${id}/reset-password/`, {method:'POST'}),
  async logout() {
    const refreshToken = getTokens().refresh_token;
    try { if (refreshToken) await call(BASE.auth, `/auth/logout/?refresh_token=${encodeURIComponent(refreshToken)}`, { method: 'POST' }, false); }
    finally { clearSession(); }
  },
  lessons: () => call(BASE.education, '/lessons/'),
  progress: () => call(BASE.education, '/progress/'),
  progressDetail: id => call(BASE.education, `/progress/${id}/`),
  progressSummary: () => call(BASE.education, '/student-progress/summary/'),
  achievements: () => call(BASE.education, '/student-progress/achievements/'),
  activities: () => call(BASE.education, '/student-progress/activities/'),
  completeLesson: lessonId => call(BASE.education, '/student-progress/lesson-complete/', {
    method: 'POST', body: JSON.stringify({ lesson_id: Number(lessonId) }),
  }),
  completeAssignment: payload => call(BASE.education, '/student-progress/assignment-complete/', {
    method: 'POST', body: JSON.stringify(payload),
  }),
  completeGame: payload => call(BASE.education, '/student-progress/game-complete/', {
    method: 'POST', body: JSON.stringify(payload),
  }),
  assignmentResults: () => call(BASE.education, '/results/assignments/'),
  gameResults: () => call(BASE.education, '/results/games/'),
  statistics: () => call(BASE.education, '/statistics/'),
  classPerformance: () => call(BASE.education, '/class-performance/'),
  goals: () => call(BASE.education, '/goals/'),
  createGoal: payload => call(BASE.education, '/goals/', { method: 'POST', body: JSON.stringify(payload) }),
  updateGoal: (id,payload) => call(BASE.education, `/goals/${id}/`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteGoal: id => call(BASE.education, `/goals/${id}/`, { method: 'DELETE' }),
  projects: () => call(BASE.education, '/projects/'),
  createProject: payload => call(BASE.education, '/projects/', { method: 'POST', body: JSON.stringify(payload) }),
  updateProject: (id,payload) => call(BASE.education, `/projects/${id}/`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProject: id => call(BASE.education, `/projects/${id}/`, { method: 'DELETE' }),
  notes: () => call(BASE.education, '/notes/'),
  createNote: payload => call(BASE.education, '/notes/', { method: 'POST', body: JSON.stringify(payload) }),
  updateNote: (id,payload) => call(BASE.education, `/notes/${id}/`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteNote: id => call(BASE.education, `/notes/${id}/`, { method: 'DELETE' }),
  bookmarks: () => call(BASE.education, '/bookmarks/'),
  createBookmark: payload => call(BASE.education, '/bookmarks/', { method: 'POST', body: JSON.stringify(payload) }),
  deleteBookmark: id => call(BASE.education, `/bookmarks/${id}/`, { method: 'DELETE' }),
  notifications: () => call(BASE.education, '/notifications/'),
  readNotification: id => call(BASE.education, `/notifications/${id}/`, { method: 'PATCH', body: JSON.stringify({is_read:true}) }),
  readAllNotifications: () => call(BASE.education, '/notifications/read-all/', { method: 'POST' }),
  preferences: () => call(BASE.education, '/preferences/'),
  updatePreferences: payload => call(BASE.education, '/preferences/', { method: 'PUT', body: JSON.stringify(payload) }),
  leaderboard: scope => call(BASE.education, `/leaderboard/${scope?`?scope=${scope}`:''}`),
  myGroup: () => call(BASE.education, '/my-group/'),
  classroom: () => call(BASE.education, '/classroom/'),
  planClassLesson: (classId,lessonId,scheduledAt=null) => call(BASE.education, `/classes/${classId}/lessons/`, {method:'POST',body:JSON.stringify({lesson_id:Number(lessonId),...(scheduledAt?{scheduled_at:scheduledAt}:{})})}),
  openClassLesson: (classId,id) => call(BASE.education, `/classes/${classId}/lessons/${id}/open/`, {method:'POST'}),
  completeClassLesson: (classId,id) => call(BASE.education, `/classes/${classId}/lessons/${id}/complete/`, {method:'POST'}),
  homeworks: () => call(BASE.education, '/homeworks/'),
  createHomework: payload => call(BASE.education, '/homeworks/', {method:'POST',body:JSON.stringify(payload)}),
  startHomework: id => call(BASE.education, `/homeworks/${id}/start/`, {method:'POST'}),
  submitHomework: (id,payload) => call(BASE.education, `/homeworks/${id}/submit/`, {method:'POST',body:JSON.stringify(payload)}),
  homeworkSubmissions: id => call(BASE.education, `/homeworks/${id}/submissions/`),
  chats: () => call(BASE.education, '/chats/'),
  createChat: payload => call(BASE.education, '/chats/', { method: 'POST', body: JSON.stringify(payload) }),
  chatMessages: id => call(BASE.education, `/chats/${id}/messages/`),
  sendChatMessage: (id,text) => call(BASE.education, `/chats/${id}/messages/`, { method: 'POST', body: JSON.stringify({text}) }),
  readChat: id => call(BASE.education, `/chats/${id}/read/`, { method: 'POST' }),
  assignments: () => call(BASE.assignments, '/assignments/'),
  questions: () => call(BASE.assignments, '/questions/'),
  answers: () => call(BASE.assignments, '/answers/'),
  createAssignment: payload => call(BASE.assignments, '/assignments/', { method: 'POST', body: JSON.stringify(payload) }),
  createQuestion: payload => call(BASE.assignments, '/questions/', { method: 'POST', body: JSON.stringify(payload) }),
  createAnswer: payload => call(BASE.assignments, '/answers/', { method: 'POST', body: JSON.stringify(payload) }),
  checkAnswer: (questionId, answer) => call(BASE.assignments, '/answers/check/', {
    method: 'POST', body: JSON.stringify({ question_id: questionId, answer }),
  }),
  educationList: resource => call(BASE.education, `/${resource}/`),
  educationDetail: (resource, id) => call(BASE.education, `/${resource}/${id}/`),
  educationCreate: (resource, payload) => call(BASE.education, `/${resource}/`, { method: 'POST', body: JSON.stringify(payload) }),
  educationUpdate: (resource, id, payload) => call(BASE.education, `/${resource}/${id}/`, { method: 'PUT', body: JSON.stringify(payload) }),
  educationDelete: (resource, id) => call(BASE.education, `/${resource}/${id}/`, { method: 'DELETE' }),
  students: () => call(BASE.education, '/students/'),
  studentDetail: id => call(BASE.education, `/students/${id}/`),
  createStudent: payload => call(BASE.education, '/students/create/', { method: 'POST', body: JSON.stringify(payload) }),
  deleteStudent: id => call(BASE.education, `/students/${id}/delete/`, { method: 'DELETE' }),
};
