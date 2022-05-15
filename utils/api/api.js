const uPostAuth = '/auth' // 鉴权
// const uLogin = '/auth/testLogin'
const uLogin = '/auth/login'
const uGetUserInfo = '/client'
const uSignUp = '/client/signup' // 用户注册
const uGetCourse = '/course/get_course'// 获取课程详情
const uGetSession = '/session/get_session_details'// 获取单课详情
const uControlStart = '/control/start'
const uGetStatistic = '/session/get_session_statistic'
const uPostFeedback = '/session/feedback'
const uAssessStatus = '/client/assess_status'
const uPhysicalExam = '/physical_exam'
const uGetMedicalHistoryQT = '/client/get_medical_history_qt'
const uRegMedicalHistoryQT = '/client/reg_medical_history_qt'
// 抛出getCourseInfo这个常量
module.exports = {
  uPostAuth,
  uLogin,
  uGetUserInfo,
  uSignUp,
  uGetCourse,
  uGetSession,
  uControlStart,
  uGetStatistic,
  uPostFeedback,
  uAssessStatus,
  uPhysicalExam,
  uGetMedicalHistoryQT,
  uRegMedicalHistoryQT
}
