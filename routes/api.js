const express = require('express')
const router = express.Router()
const code = require('../const/responseCode')
const repo = require('../repository/androidRepo')

function responseSuccess (res, entry) {
  res.send({
    status: true,
    responseCode: 0,
    message: 'success',
    entry
  })
}
function responseFail (res, responseCode, message) {
  res.send({
    status: false,
    responseCode,
    message
  })
}

router.get('/log/list', function (req, res) {
  const { appName, buildNum } = req.query
  if (appName == null || buildNum == null) {
    responseFail(res, code.LOG_IllegalArgument, 'appName 和 buildNum 不能为空')
    return
  }
  const logs = repo.queryLogList(appName, buildNum)
  responseSuccess(res, { list: logs })
})

router.get('/report/list', function (req, res) {
  let { appName, buildNum, pageIndex, pageSize } = req.query
  //   if (appName == null ) {
  //     responseFail(res, code.LOG_IllegalArgument, "appName  不能为空");
  //     return;
  //   }
  if (!appName) {
    appName = 'FXJ'
  }
  const reportJson = repo.queryReportList(appName, buildNum, pageIndex, pageSize)
  responseSuccess(res, reportJson)
})

router.get('/log/build/list', function (req, res) {
  const builds = repo.queryLogBuildList(req.query.appName)
  responseSuccess(res, { list: builds })
})

router.post('/report/create', function (req, res) {
  console.log(req.body)
  // res.setHeader('Access-Control-Allow-Origin','*')

  //     res.send('hello ajax')
  console.log('createReport 1')
  repo.createReport(req.body)
  console.log('createReport 2')
  responseSuccess(res, 2)
})

module.exports = router
