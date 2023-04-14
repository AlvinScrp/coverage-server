const express = require('express')
const router = express.Router()
const androidRepo = require('../repository/androidRepo')
const iOSRepo = require('../repository/iOSRepo')

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

function repoOf (osType) {
  return osType === 'Android' ? androidRepo : iOSRepo
}

router.get('/log/list', function (req, res) {
  const { appName, buildNum } = req.query
  if (appName == null || buildNum == null) {
    responseFail(res, 1001, 'appName 和 buildNum 不能为空')
    return
  }
  const repo = repoOf(req.query.osType)
  const logs = repo.queryLogList(appName, buildNum)
  responseSuccess(res, { list: logs })
})

router.get('/report/list', function (req, res) {
  let { appName, buildNum, pageIndex, pageSize } = req.query
  if (!appName) {
    appName = 'FXJ'
  }
  const repo = repoOf(req.query.osType)
  const reportJson = repo.queryReportList(appName, buildNum, pageIndex, pageSize)
  responseSuccess(res, reportJson)
})

router.get('/log/build/list', function (req, res) {
  const repo = repoOf(req.query.osType)
  const builds = repo.queryLogBuildList(req.query.appName)
  responseSuccess(res, { list: builds })
})

router.post('/report/create', function (req, res) {
  console.log(req.body)
  // res.setHeader('Access-Control-Allow-Origin','*')

  //     res.send('hello ajax')
  console.log('createReport 1')
  const repo = repoOf(req.body.osType)
  repo.createReport(req.body, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec stdout: ${stdout}`)
      responseFail(res, 1002, `stdout:${stdout} \\\n stderr:${stderr}`)
      return
    }
    console.log(`stdout: \n${stdout}`)
    responseSuccess(res, 2)
    console.log('createReport response')
    //   console.error(`stderr: ${stderr}`);
  })
  console.log('createReport 2')
})

module.exports = router
